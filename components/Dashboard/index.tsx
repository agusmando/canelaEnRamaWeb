import {
  useSessionContext,
  signOut,
} from "supertokens-auth-react/recipe/session";
import { getApiDomain } from "../../config/config";
import { useNavigate } from "react-router-dom";
import Session from "supertokens-auth-react/recipe/session";

async function getJWT() {
  if (await Session.doesSessionExist()) {
    let userId = await Session.getUserId();
    let jwt = await Session.getAccessToken();
    console.log(userId, jwt);
  }
}

async function callApi() {
  try {
    const response = await fetch("http://localhost:8080/getJWT");
    const data = await response.json();
    window.alert("Session Information:\n" + JSON.stringify(data, null, 2));
  } catch (err) {
    window.alert("Error calling API: " + err.message);
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const sessionContext = useSessionContext();

  async function callAPIClicked() {
    try {
      const response = await fetch(getApiDomain() + "/sessioninfo");
      const data = await response.json();
      window.alert("Session Information:\n" + JSON.stringify(data, null, 2));
    } catch (err) {
      window.alert("Error calling API: " + err.message);
    }
  }

  async function logoutClicked() {
    await signOut();
    navigate("/auth");
  }

  return (
    <>
      <div className="main-container">
        <div className="top-band success-title bold-500">
          <img
            src="/assets/images/celebrate-icon.svg"
            alt="Login successful"
            className="success-icon"
          />
          Login successful
        </div>
        <div className="inner-content">
          <div>Your userID is:</div>
          <div className="truncate" id="user-id">
            {sessionContext.userId}
          </div>
          <div className="buttons">
            <button onClick={getJWT} className="dashboard-button">
              check JWT
            </button>
            <button onClick={callApi} className="dashboard-button">
              Call API
            </button>
            <button onClick={logoutClicked} className="dashboard-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
