import {
  Button,
  Badge,
  Menu,
  MenuItem,
  Stack,
  Alert,
  AlertTitle,
  Snackbar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { SocketContext } from "context/socket";
import { useState, useContext, useEffect } from "react";
import { getToken } from "services/auth.service";
import { getNotifications } from "services/notification.service";
import TimeAgo from "react-timeago";
import vietStrings from "react-timeago/lib/language-strings/vi";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";

export default function Notification() {
  const formatter = buildFormatter(vietStrings);
  const [notifications, setNotifications] = useState([]);
  const socket = useContext(SocketContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [newNotification, setNewNotification] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  async function fetchNotification() {
    const res = await getNotifications();
    if (res.data.length !== 0) {
      // console.log(res.data)
      setNotifications(res.data);
    }
  }
  function handleCloseSnackbar() {
    setNewNotification(false);
  }

  useEffect(() => {
    fetchNotification();
    socket.emit("join notification", getToken());
    socket.on("broadcast notification", (notification) => {
      setNotifications(notifications.push(notification));
    });
    socket.on("new notification", () => {
      console.log("new notification");
      setNewNotification(true);
      fetchNotification();
    });
  }, []);
  return (
    <>
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        {notifications.length === 0 ? (
          <NotificationsIcon sx={{ color: "white" }} />
        ) : (
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon sx={{ color: "white" }} />
          </Badge>
        )}
      </Button>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={newNotification}
        onClose={handleCloseSnackbar}
        message="I love snacks"
        autoHideDuration={2000}
      >
        <Alert severity="success">B???n c?? th??ng b??o m???i!</Alert>
      </Snackbar>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem onClick={handleClose}>
            <Alert severity="success">
              <AlertTitle>Nothing here</AlertTitle>
              No one cares about <strong>you!</strong>
            </Alert>
          </MenuItem>
        ) : (
          notifications.map((notification) => {
            switch (notification.type) {
              case "finalize_grade":
                return (
                  <MenuItem key={notification.id} onClick={handleClose}>
                    <Alert sx={{ width: "100%" }} severity="warning">
                      <AlertTitle sx={{ width: "100%" }}>
                        Gi??o vi??n {notification.fromUser.fullname} ???? th???c hi???n
                        c??ng b??? ??i???m.
                      </AlertTitle>

                      <Stack
                        sx={{ width: "100%" }}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <strong>
                          {notification.classNotification.className}
                        </strong>
                        <TimeAgo
                          date={notification.createdAt}
                          formatter={formatter}
                        />
                      </Stack>
                    </Alert>
                  </MenuItem>
                );
              case "grade_review_reply":
                return (
                  <MenuItem key={notification.id} onClick={handleClose}>
                    <Alert sx={{ width: "100%" }} severity="info">
                      <AlertTitle sx={{ width: "100%" }}>
                        Gi??o vi??n {notification.fromUser.fullname} ???? tr??? l???i
                        y??u c???u ph??c kh???o c???a b???n.
                      </AlertTitle>

                      <Stack
                        sx={{ width: "100%" }}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <strong>
                          {notification.classNotification.className}
                        </strong>
                        <TimeAgo
                          date={notification.createdAt}
                          formatter={formatter}
                        />
                      </Stack>
                    </Alert>
                  </MenuItem>
                );
              case "grade_review_final":
                return (
                  <MenuItem key={notification.id} onClick={handleClose}>
                    <Alert sx={{ width: "100%" }} severity="success">
                      <AlertTitle sx={{ width: "100%" }}>
                        Gi??o vi??n {notification.fromUser.fullname} ???? ho??n th??nh
                        y??u c???u ph??c kh???o ??i???m c???a b???n.
                      </AlertTitle>

                      <Stack
                        sx={{ width: "100%" }}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <strong>
                          {notification.classNotification.className}{" "}
                        </strong>
                        <TimeAgo
                          date={notification.createdAt}
                          formatter={formatter}
                        />
                      </Stack>
                    </Alert>
                  </MenuItem>
                );
              case "grade_review_request":
                return (
                  <MenuItem key={notification.id} onClick={handleClose}>
                    <Alert sx={{ width: "100%" }} severity="info">
                      <AlertTitle sx={{ width: "100%" }}>
                        H???c sinh {notification.fromUser.fullname} ???? y??u c???u
                        ph??c kh???o ??i???m.
                      </AlertTitle>

                      <Stack
                        sx={{ width: "100%" }}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <strong>
                          {notification.classNotification.className}
                        </strong>
                        <TimeAgo
                          date={notification.createdAt}
                          formatter={formatter}
                        />
                      </Stack>
                    </Alert>
                  </MenuItem>
                );
              default:
                return <> </>;
            }
          })
        )}
      </Menu>
    </>
  );
}
