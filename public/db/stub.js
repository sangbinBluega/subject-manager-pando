window.mqfMapData = window.mqfMapData || {_cfg:{}}

/*  storage
        ...
    resolver
        ...
*/
mqfMapData.set = function(/*String*/group, /*String*/key, value)
{
    this._cfg[group] = this._cfg[group] || {};
    this._cfg[group][key] = value;
}

mqfMapData.get = function(/*String*/group, /*String*/key)/*Value|undefined*/
{
    if (this._cfg[group]) return this._cfg[group][key];
}

mqfMapData.init = function(onSucc, onErr)
{
    //  보안 목적으로 Resolver를 LOG에 표시할 때, 뒤의 2개만 표시도록 함
    function cutResolver(str)
    {
        if (str){
            var str = str.split('/');

            return "'" + (str.length > 1 ? str[str.length-2]+'/'+str[str.length-1] : str[0]) + "'";
        }
    }

    var _this = this;

    //  사전과 사전GROUP이 로딩되면 주제로 변환함
    var workCntAll = 3, workCnt = 0;

    function processDict()
    {
        workCnt ++;

        if (workCnt == workCntAll){
            // var log = '';

            // if (_this.subject) log += (log?'\n':'') + 'Subject is loaded from '+ cutResolver(_this._cfg.resolver.subject.call(_this));
            // if (_this.dict) log += (log?'\n':'') + 'Dict is loaded from '+ cutResolver(_this._cfg.resolver.dict.call(_this));
            // if (_this.dictGroup) log += (log?'\n':'') + 'DictGroup is loaded from '+ cutResolver(_this._cfg.resolver.dictGroup.call(_this));
            // if (_this.phrase) log += (log?'\n':'') + 'Phrase is loaded from '+ cutResolver(_this._cfg.resolver.phrase.call(_this));
            // if (log) tsPando.log.call(_this, 0, log);

            //  단어와 단어GROUP을 주제에 병합
            tsPando.subjectFromDict.call(_this, _this.subject, _this.dict, _this.dictGroup);
        
            //  Phrase를 주제에 병합
            _this.phraseWord = tsPando.subjectFromPhrase.call(_this, _this.subject, _this.phrase);

            //  Graph Loop Check
            var loop = tsPando.graphCheckLoop(_this.subject);
            
            if (loop.unknown){
                tsPando.log.call(_this, 2, 'Subject - Unknown. '+loop.unknown); //%%검증
            }

            if (loop.cycled){
                if (onErr) onErr(2, 'Subject - Graph cycled. '+loop.cycled);
                return;
            }

            if (onSucc) onSucc();
        }
    }

    //  주제 로딩
    this._cfg.storage.subject.call(this, /*all*/undefined
        ,function (/*{}*/subject){
            _this.subject = subject;
            processDict();
        }
        ,function(err){
            if (onErr) onErr(2, 'Subject - Storage error from '+ cutResolver(_this._cfg.resolver.subject.call(_this)));
        }
    );

    //  사전 로딩 - 주제 변환을 위함
    _this._cfg.storage.dict.call(_this, /*all*/undefined
        ,function (key, /*{}*/dict){
            _this.dict = dict;
            processDict(); // 없을 경우도 있음. TOOL에서 생성함
        }
        ,function(err){
            if (onErr) onErr(2, 'Dict - Storage error from '+ cutResolver(_this._cfg.resolver.dict.call(_this)));
        }
    );

    //  사전 GROUP 로딩 - 주제 변환을 위함
    _this._cfg.storage.dictGroup.call(_this, /*all*/undefined
        ,function (key, /*{}*/dictGroup){
            _this.dictGroup = dictGroup;
            processDict();
        }
        ,function(err){
            if (onErr) onErr(2, 'DictGroup - Storage error from '+ cutResolver(_this._cfg.resolver.dictGroup.call(_this)));
        }
    );

    //  Phrase 로딩 - 주제 변환을 위함
    if (_this._cfg.storage.phrase){
        workCntAll ++;
        _this._cfg.storage.phrase.call(_this, /*all*/undefined
            ,function (key, /*{}*/phrase){
                _this.phrase = phrase;
                processDict();
            }
            ,function(err){
                if (onErr) onErr(2, 'Phrase - Storage error from '+ cutResolver(_this._cfg.resolver.phrase.call(_this)));
            }
        );
    }
}

mqfMapData.set('storage', 'subject', eccSubjectLoad);
mqfMapData.set('resolver', 'subject', eccSubjectResolve);
mqfMapData.set('storage', 'dict', eccDictLoad);
mqfMapData.set('resolver', 'dict', eccDictResolve);
mqfMapData.set('storage', 'dictGroup', eccDictGroupLoad);
mqfMapData.set('resolver', 'dictGroup', eccDictGroupResolve);
mqfMapData.set('storage', 'phrase', eccPhraseLoad);
mqfMapData.set('resolver', 'phrase', eccPhraseResolve);
