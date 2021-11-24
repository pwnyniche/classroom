import http from "axios-config";

export async function login(values) {
  return http
    .post("/users/login/", values)
    .then((res) => {
      console.log(res.data);
      if (res.data.accessToken) {
        localStorage.setItem("user", JSON.stringify(res.data));
        return true;
      }
      return false;
    })
    .catch((error) => {
      console.log("err: ", error);
      return false;
    });
}

export function logout() {
  localStorage.removeItem("user");
}

export function register(values) {
  return http
    .post("/users/register/", values)
    .then((res) => {
      console.log("res", res);
      if (res.status === 200 || res.status === 201) {
        alert("Registered successfully!");
      } else {
        alert("Please try again later");
      }
    })
    .catch((error) => {
      console.log("err: ", error);
    });
}

export function getToken() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).accessToken : {};
}
