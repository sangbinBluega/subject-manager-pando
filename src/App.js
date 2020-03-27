import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import MUIDataTable from "mui-datatables";
import { Scrollbars } from "react-custom-scrollbars";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";

const useStyles = makeStyles(theme => ({
  header: {
    width: "100%",
    height: "35px",
    backgroundColor: "rgb(121, 121, 121)",
    boxShadow: "none",
    position: "fixed",
    border: "0px",
    padding: "5px 5px 5px 10px",
    alignItems: "center"
  },
  toolBar: {
    minHeight: "0px"
  },
  title: {
    flexGrow: 1,
    paddingLeft: "10px"
  }
}));

const columns = ["ID", "TITLE"];
let arrList = [];
let sendValue = [];
let sendTrId = "";
let sendType = "";

function App() {
  const classes = useStyles();
  const [subjectList, setSubjectList] = useState([]);
  const [selected, setSelected] = useState([]);
  const tableDiv = useRef();
  const [open, setOpen] = useState(false);

  window.mqfMapData.init(
    function() {
      if (arrList.length > 0) {
        return;
      }

      let mapDatas = window.mqfMapData.subject;

      for (let i in mapDatas) {
        arrList.push([i, mapDatas[i].titleShort || mapDatas[i].title]);
      }

      let subjectMap = {};

      for (let i in mapDatas) {
        subjectMap[i] = {
          title: mapDatas[i].titleShort || mapDatas[i].title
        };
      }

      window.parent.postMessage(
        {
          mqfEditor: {
            event: "onListMeta",
            data: { type: "subject", value: subjectMap }
          }
        },
        "*"
      );
    },
    function(level, log) {
      window.tsPando.log.call(window.mqfMapData, level, log);
    }
  );

  useEffect(() => {
    if (subjectList.length > 0) {
      return;
    }
    window.addEventListener(
      "message",
      function(ev) {
        if (ev.data && ev.data.mqfEditor) {
          var event = ev.data.mqfEditor.event;
          var data = ev.data.mqfEditor.data;

          if (event === "edit") {
            if (!data.value[0]) {
              window.parent.postMessage(
                { mqfEditor: { event: "hideButton", data: "subject" } },
                "*"
              );
              return;
            }

            let value = data.value[0].value;

            sendTrId = data.value[0].data;

            let count = value[0].length;
            let number = [];

            for (let i = 0; i < arrList.length; i++) {
              if (value.indexOf(arrList[i][0]) > -1) {
                count--;
                number.push(i);
                if (count === 0) {
                  break;
                }
              }
            }
            setSelected(number);

            window.parent.postMessage(
              { mqfEditor: { event: "showButton", data: "subject" } },
              "*"
            );
          } else if (event === "reset") {
            setSelected("");
            setSubjectList(arrList);
          }

          if (tableDiv.current) {
            tableDiv.current.childNodes[0].style.boxShadow = "none";
          }

          setSubjectList(arrList);
        }
      },
      false
    );
  });

  const onSelectSubjects = (rows, all) => {
    sendValue = [];
    rows.forEach(function(item) {
      sendValue.push(all[item.index].data[0]);
    });
  };

  const options = {
    filterType: "checkbox",
    filter: false,
    print: false,
    download: false,
    selectableRowsOnClick: true,
    disableToolbarSelect: true,
    rowsSelected: selected,
    responsive: "scrollFullHeight",
    viewColumns: false,
    rowsPerPageOptions: [10, 50, 100],
    onTableChange: (action, tableState) => {
      if (action === "rowsSelect") {
        onSelectSubjects(tableState.selectedRows.data, tableState.data);
      }
    },
    customToolbar: () => (
      <Button size="large" color="primary" onClick={onClickSet}>
        Set
      </Button>
    )
  };

  const onClickSet = () => {
    //  Asset과 달리, 주제는 Mandatory Field가 아니므로 값이 없어도 그대로 전송함
    window.parent.postMessage(
      {
        mqfEditor: {
          event: "onSetMeta",
          data: {
            target: "subjectManager",
            trId: sendTrId,
            type: sendType,
            value: sendValue.length ? sendValue : undefined
          }
        }
      },
      "*"
    );

    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <AppBar className={classes.header}>
        <Toolbar className={classes.toolBar}>
          <Typography className={classes.title}>
            PANDO - SUBJECT MANAGER
          </Typography>
        </Toolbar>
      </AppBar>
      <Scrollbars
        style={{ top: "35px", height: "calc(100% - 85px)", zIndex: 1 }}
      >
        {subjectList.length > 0 && selected.length > 0 && (
          <div style={{ width: "calc(100% - 15px)" }} ref={tableDiv}>
            <MUIDataTable
              title={"SUBJECT LIST"}
              data={subjectList}
              columns={columns}
              options={options}
            />
          </div>
        )}
      </Scrollbars>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={open}
        autoHideDuration={1000}
        onClose={handleClose}
        message="Success!"
      ></Snackbar>
    </>
  );
}

export default App;
