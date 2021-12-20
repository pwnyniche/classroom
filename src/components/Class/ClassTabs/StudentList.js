import * as React from "react";
import PropTypes from "prop-types";
import { useRef, useState, useEffect } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import {
  GridColumnMenu,
  GridColumnMenuContainer,
  GridFilterMenuItem,
  SortGridMenuItems,
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  gridClasses,
} from "@mui/x-data-grid";
import { MenuItem, Grid, Box } from "@mui/material";
import ImportStudentDialog from "components/Class/ClassTabs/ImportDialog/ImportStudentDialog";
import ImportGradeDialog from "components/Class/ClassTabs/ImportDialog/ImportGradeDialog";
import { Link } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import SaveIcon from "@mui/icons-material/Save";
import { getStudentList, updateStudentList } from "services/class.service";
import {
  getStudentGrades,
  updateStudentGrades,
  updateFinalize,
} from "services/grade.service";
import Typography from "@mui/material/Typography";
import AnchorElTooltips from "./utils/AnchorElTooltips";
import CircularProgress from "@mui/material/CircularProgress";

const StyledGridColumnMenuContainer = styled(GridColumnMenuContainer)(
  ({ theme, ownerState }) => ({
    background: theme.palette[ownerState.color].main,
    color: theme.palette[ownerState.color].contrastText,
  })
);

const StyledGridColumnMenu = styled(GridColumnMenu)(
  ({ theme, ownerState }) => ({
    background: theme.palette[ownerState.color].main,
    color: theme.palette[ownerState.color].contrastText,
  })
);

function CustomColumnMenuComponent(props) {
  const {
    hideMenu,
    currentColumn,
    color,
    rows,
    setRows,
    assignments,
    setAssignments,
    ...other
  } = props;
  const [isOpenImportGrade, setIsOpenImportGrade] = useState(false);
  const params = useParams();

  function handleImportGrade() {
    setIsOpenImportGrade(true);
  }

  async function handleFinalize() {
    setAssignments((assignments) => {
      let newAssignments = assignments.slice();
      for (const assignment of newAssignments) {
        if (assignment.id.toString() === currentColumn["field"]) {
          assignment.finalize = !assignment.finalize;
          break;
        }
      }
      return newAssignments;
    });
    await updateFinalize(currentColumn["field"], params.id);
  }

  function updateGrade(rows, grade) {
    var data = rows.slice();
    var checkExist = false;
    for (const row of data) {
      if (row.studentId === grade.studentId) {
        checkExist = true;
        row[currentColumn["field"]] = grade.grade;
        break;
      }
    }
    if (!checkExist) {
      delete grade.guid;
      grade[currentColumn["field"]] = grade.grade;
      data.push(grade);
    }
    return data;
  }

  const handleClose = (value) => {
    setIsOpenImportGrade(false);
    if (value) {
      value.forEach((vl) => {
        setRows((prevrows) => updateGrade(prevrows, vl));
      });
    }
    console.log("close", value);
  };

  if (currentColumn.field === "name") {
    return (
      <StyledGridColumnMenuContainer
        hideMenu={hideMenu}
        currentColumn={currentColumn}
        ownerState={{ color }}
        {...other}
      >
        <SortGridMenuItems onClick={hideMenu} column={currentColumn} />
        <GridFilterMenuItem onClick={hideMenu} column={currentColumn} />
      </StyledGridColumnMenuContainer>
    );
  }
  if (
    currentColumn.field !== "fullName" &&
    currentColumn.field !== "studentId" &&
    currentColumn.field !== "total"
  ) {
    return (
      <StyledGridColumnMenuContainer
        hideMenu={hideMenu}
        currentColumn={currentColumn}
        ownerState={{ color }}
        sx={{}}
        {...other}
      >
        <MenuItem onClick={handleImportGrade}>Import Grade</MenuItem>
        <MenuItem onClick={handleFinalize}>Mark as Finalize</MenuItem>
        <ImportGradeDialog open={isOpenImportGrade} onClose={handleClose} />
      </StyledGridColumnMenuContainer>
    );
  }
  return (
    <StyledGridColumnMenu
      hideMenu={hideMenu}
      currentColumn={currentColumn}
      ownerState={{ color }}
      {...other}
    />
  );
}

CustomColumnMenuComponent.propTypes = {
  color: PropTypes.string.isRequired,
  currentColumn: PropTypes.object.isRequired,
  hideMenu: PropTypes.func.isRequired,
};

export { CustomColumnMenuComponent };

function CustomToolbar(props) {
  const { handleClickOpen } = props;

  return (
    <GridToolbarContainer className={gridClasses.toolbarContainer}>
      <GridToolbarExport
        sx={{ mr: 1, ml: 2 }}
        csvOptions={{ allColumns: true, utf8WithBom: true }}
      />
      <Button
        startIcon={<UploadIcon fontSize="small" />}
        sx={{ mr: 1, ml: 2 }}
        onClick={handleClickOpen}
      >
        Import
      </Button>
      <Grid container justifyContent="flex-end">
        <Link
          to="/StudentTemplate.xlsx"
          target="_blank"
          download
          style={{ textDecoration: "none" }}
        >
          <Button startIcon={<DownloadIcon fontSize="small" />} sx={{ mr: 1 }}>
            Download Student Template
          </Button>
        </Link>
        <Link
          to="/GradingTemplate.xlsx"
          target="_blank"
          download
          style={{ textDecoration: "none" }}
        >
          <Button startIcon={<DownloadIcon fontSize="small" />} sx={{ mr: 1 }}>
            Download Grade Template
          </Button>
        </Link>
      </Grid>
    </GridToolbarContainer>
  );
}
export { CustomToolbar };

export default function StudentList(props) {
  const params = useParams();
  const navigate = useNavigate();
  const { items } = props;
  const [assignments, setAssignments] = React.useState(items.assignments);
  const [color] = React.useState("primary");

  const [rows, setRows] = useState([]);
  const [isOpenImportStudent, setIsOpenImportStudent] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  useEffect(() => {
    function addGrades(grades, rows) {
      var data = rows.slice();
      for (const row of data) {
        for (const grade of grades) {
          if (row.id === grade.studentIdFk) {
            row[grade.assignmentId] = grade.grade;
            row.finalize = grade.finalize;
          }
        }
      }
      return data;
    }
    async function getAssignmentGrades(assignmentId, classId) {
      const res = await getStudentGrades(assignmentId, classId);
      let grades = res.data ? res.data : [];
      setRows((prevState) => addGrades(grades, prevState));
    }
    async function fetchStudentList() {
      const res = await getStudentList(params.id);
      var data = res.data ? res.data : [];
      setRows(data);
      for (const assignment of assignments) {
        getAssignmentGrades(assignment.id.toString(), params.id);
      }
    }
    if (params) {
      fetchStudentList();
    } else {
      navigate("/", { replace: true });
    }
  }, [params, navigate, assignments]);

  const handleClickOpen = () => {
    setIsOpenImportStudent(true);
  };

  const handleSave = async () => {
    setIsSavingData(true);
    const body = {
      studentList: [...apiRef.current?.getRowModels().values()],
    } || { studentList: null };
    await updateStudentList(params.id, body);
    var count = 0;
    async function updateGradeAsync(assignmentId, body, classId) {
      await updateStudentGrades(assignmentId, body, classId);
      count += 1;
      console.log(assignments.length);
      if (count === assignments.length) {
        setIsSavingData(false);
      }
    }
    assignments.forEach((assignment) => {
      updateGradeAsync(assignment.id.toString(), body, params.id);
    });
  };

  const handleClose = (value) => {
    setIsOpenImportStudent(false);
    if (value) {
      value.forEach((vl) => {
        setRows((prevrows) => [...prevrows, vl]);
      });
    }
    console.log("close", value);
  };

  function getTotal(params) {
    let total = 0;
    let totalPoint = 0;
    let totalFactor = 0;
    assignments.forEach((assignment) => {
      totalPoint +=
        params.row[assignment.id.toString()] * assignment.point || 0;
      totalFactor += assignment.point || 0;
    });
    total = totalPoint / totalFactor;
    return total;
  }

  const columns = [
    {
      field: "studentId",
      headerName: "Student ID",
      flex: 1.0,
    },
    {
      field: "fullName",
      headerName: "Full Name",
      flex: 1.0,
      minWidth: 150,
      renderCell: (params) => {
        if (params.value.extra) {
          return (
            <AnchorElTooltips
              title={params.value.extra.fullname}
              content={params.value.val}
              color="blue"
            />
          );
        }
        if (params.value.val) {
          return <Typography>{params.value.val}</Typography>;
        }
        return <Typography>{params.value}</Typography>;
      },
    },
  ];

  assignments.forEach((assignment) => {
    columns.push({
      field: assignment.id.toString(),
      headerClassName: assignment.finalize ? "finalize" : "unfinalize",
      headerName: assignment.title,
      editable: true,
      type: "number",
      flex: 1.0,
    });
  });

  columns.push({
    field: "total",
    headerName: "Total",
    flex: 1.0,
    valueGetter: getTotal,
  });

  function useApiRef() {
    const apiRef = useRef(null);
    const _columns = useMemo(
      () =>
        columns.concat({
          field: "__HIDDEN__",
          width: 0,
          disableExport: true,
          // hide: true,
          renderCell: (params) => {
            apiRef.current = params.api;
            return null;
          },
        }),
      [columns]
    );
    return { apiRef, columns: _columns };
  }

  const { apiRef, columns: columns2 } = useApiRef();

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          marginTop: 16,
        }}
      >
        <Box
          sx={{
            ".finalize": {
              backgroundColor: "rgba(255, 7, 0, 0.55)",
            },
            ".unfinalize": {
              backgroundColor: "rgba(157, 255, 118, 0.49)",
            },
          }}
        >
          <DataGrid
            autoHeight
            columns={columns2}
            rows={rows}
            components={{
              ColumnMenu: CustomColumnMenuComponent,
              Toolbar: CustomToolbar,
            }}
            componentsProps={{
              columnMenu: { color, rows, setRows, assignments, setAssignments },
              toolbar: { handleClickOpen, handleSave },
            }}
          />
        </Box>
      </div>
      <Grid container justifyContent="flex-end">
        {isSavingData ? (
          <CircularProgress />
        ) : (
          <>
            <Button
              startIcon={<SaveIcon fontSize="small" />}
              sx={{ mr: 1 }}
              onClick={handleSave}
            >
              Save
            </Button>
          </>
        )}
      </Grid>

      <ImportStudentDialog open={isOpenImportStudent} onClose={handleClose} />
    </div>
  );
}
