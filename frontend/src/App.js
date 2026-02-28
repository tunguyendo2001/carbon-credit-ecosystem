import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import UserLogin from "./pages/UserLogin/UserLogin";
import UserRegistration from "./pages/UserRegistration/UserRegistration";
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import React, { useMemo, useState } from "react";
import UserSelection from "./pages/UserSelection/UserSelection";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("generator");

  const { routeBase, forcedUserType } = useMemo(() => {
    const path = window.location.pathname;
    const firstSegment = path.split("/").filter(Boolean)[0] || "";

    const portalUserMap = {
      generator: "generator",
      consumer: "consumer",
      validator: "validator",
      validator1: "validator",
      validator2: "validator",
    };

    if (portalUserMap[firstSegment]) {
      return {
        routeBase: `/${firstSegment}`,
        // forcedUserType: portalUserMap[firstSegment],
        forcedUserType: null // open 1 path for all roles
      };
    }

    return { routeBase: "", forcedUserType: null };
  }, []);

  const withBase = (path) => `${routeBase}${path}`;

  const commonProps = {
    routeBase,
    forcedUserType,
    setUserType,
  };

  const routes = isLoggedIn ? (
    <Switch>
      <Route
        path={withBase("/user-dashboard")}
        exact
        render={(props) => {
          return (
            <UserDashboard
              {...props}
              userType={userType}
              setIsLoggedIn={setIsLoggedIn}
            />
          );
        }}
      />
      <Redirect to={withBase("/user-dashboard")}></Redirect>
    </Switch>
  ) : (
    <Switch>
      <Route
        path={withBase("/user-selection")}
        exact
        render={(props) => {
          return <UserSelection {...props} {...commonProps} />;
        }}
      />

      <Route
        path={withBase("/user-login")}
        exact
        render={(props) => {
          return <UserLogin {...props} setIsLoggedIn={setIsLoggedIn} {...commonProps} />;
        }}
      />

      <Route
        path={withBase("/user-registration")}
        exact
        render={(props) => {
          return (
            <UserRegistration
              {...props}
              setIsLoggedIn={setIsLoggedIn}
              {...commonProps}
            />
          );
        }}
      />

      <Route path={routeBase || "/"} exact>
        <Redirect to={withBase("/user-selection")}></Redirect>
      </Route>

      <Redirect to={withBase("/user-selection")}></Redirect>
    </Switch>
  );

  return (
    <Router>
      <div className="app-shell">{routes}</div>
    </Router>
  );
};

export default App;
