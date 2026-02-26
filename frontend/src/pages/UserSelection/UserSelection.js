import { Link } from "react-router-dom/cjs/react-router-dom.min";
import "./UserSelection.css";
import React, { useState } from "react";

const UserSelection = (props) => {
    const { routeBase = "", forcedUserType } = props;
    const defaultType = forcedUserType || "generator";
    const [userType, setUserType] = useState(defaultType);

    const withBase = (path) => `${routeBase}${path}`;

    return (
        <React.Fragment>
            <div className="user-selection auth-page">
                <div className="auth-card">
                    <p className="auth-kicker">Carbon Credit Ecosystem</p>
                    <h1>Chọn cổng truy cập</h1>
                    <p className="auth-subtitle">
                        Đăng nhập đúng vai trò để chạy luồng demo mint, giao dịch và retire tín chỉ carbon.
                    </p>

                    {forcedUserType ? (
                        <div className="portal-lock">Portal hiện tại chỉ dành cho vai trò: <strong>{forcedUserType}</strong></div>
                    ) : (
                        <select className="select-user" value={userType} onChange={(e) => setUserType(e.target.value)}>
                            <option value="generator">Generator</option>
                            <option value="consumer">Consumer</option>
                            <option value="validator">Validator</option>
                        </select>
                    )}

                    <div className="auth-actions">
                        <Link
                            to={{
                                pathname: withBase('/user-login'),
                                state: { userType },
                            }}
                        >
                            <button className="login-btn">Đăng nhập</button>
                        </Link>

                        <Link
                            to={{
                                pathname: withBase('/user-registration'),
                                state: { userType },
                            }}
                        >
                            <button className="register-btn">Đăng ký</button>
                        </Link>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default UserSelection;
