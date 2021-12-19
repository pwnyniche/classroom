import { Button, Dialog, DialogTitle } from "@mui/material";
import { useState } from "react";
import Excel from "exceljs";
import { guid } from "services/helper";

export default function ImportDialog(props) {
  const { onClose, open } = props;
  const workbook = new Excel.Workbook();
  const [fileExcel, setFileExcel] = useState();

  const handleClose = () => {
    onClose([]);
    setFileExcel(null);
  };

  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    setFileExcel(event.target.files[0]);
    console.log("f", fileUploaded);
  };

  const readFile = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileExcel);
    const studentList = [];
    reader.onload = async () => {
      const buffer = reader.result;
      workbook.xlsx.load(buffer).then((workbook) => {
        const sheet = workbook.worksheets[0];
        for (let i = 2; i <= sheet.actualRowCount; i++) {
          studentList.push({
            id: guid(),
            studentId: sheet.getRow(i).values[1],
            fullName: sheet.getRow(i).values[2],
          });
        }
        console.log("list", studentList);
        onClose(studentList);
        setFileExcel(null);
      });
    };
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Import Student List</DialogTitle>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        // style={{ display: "none" }}
      />
      <Button onClick={readFile} disabled={!fileExcel}>
        Import this file
      </Button>
    </Dialog>
  );
}
