import "./UserRegistration.css";
import React, { useState } from "react";

const registerGenerator = async (formData) => {
    // Thêm walletAddress
    const { firstName, lastName, email, username, password, walletAddress } = formData;
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register-generator`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, username, password, walletAddress }),
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const registerConsumer = async (formData) => {
    // Thêm walletAddress
    const { firstName, lastName, email, username, password, walletAddress } = formData;
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register-consumer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, username, password, walletAddress }),
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const registerValidator = async (formData) => {
    // Thêm walletAddress
    const { role, firstName, lastName, email, username, password, walletAddress } = formData;

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register-validator`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // Gửi thêm walletAddress xuống backend
            body: JSON.stringify({ role, firstName, lastName, email, username, password, walletAddress }),
        });

        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const UserRegistration = (props) => {
    const userType = props.location.state?.userType || props.forcedUserType || "generator";
    const { setIsLoggedIn, setUserType, routeBase = "" } = props;
    setUserType(userType);

    const withBase = (path) => `${routeBase}${path}`;

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        role: "gps-validator",
        walletAddress: "", // Thêm trường state này
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Bắt buộc tất cả các Role phải nhập ví
        if (!formData.walletAddress) {
            alert("Vui lòng nhập địa chỉ ví Ganache của bạn!");
            return;
        }

        let isRegistered = false;
        if (userType === "generator") {
            isRegistered = await registerGenerator(formData);
        } else if (userType === "consumer") {
            isRegistered = await registerConsumer(formData);
        } else {
            isRegistered = await registerValidator(formData);
        }

        if (isRegistered) {
            setIsLoggedIn(true);
            props.history.push({
                pathname: withBase("/user-dashboard"),
                state: { userType, role: formData.role },
            });
        } else {
            alert("Registration Failed!");
        }
    };

    return (
        <React.Fragment>
            <div className="user-registration auth-page">
                <form className="registration-form auth-card" onSubmit={handleSubmit}>
                    <p className="auth-kicker">Carbon Credit Ecosystem</p>
                    <h1>{userType} Registration</h1>
                    <p className="auth-subtitle">Tạo tài khoản để tham gia quy trình thẩm định và giao dịch tín chỉ carbon.</p>

                    {userType === "validator" && (
                        <select className="form-ip" name="role" value={formData.role} onChange={handleChange} required>
                            <option value="gps-validator">GPS Validator</option>
                            <option value="report-validator">Report Validator</option>
                        </select>
                    )}

                    <div className="name-ip">
                        <input className="form-ip" type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
                        <input className="form-ip" type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
                    </div>

                    <input className="form-ip" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    <input className="form-ip" type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                    <input className="form-ip" type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                    
                    <input 
                        className="form-ip" 
                        type="text" 
                        name="walletAddress" 
                        placeholder="Ganache Wallet Address (0x...)" 
                        value={formData.walletAddress} 
                        onChange={handleChange} 
                        required 
                    />

                    <button type="submit" className="form-submit">Đăng ký</button>
                </form>
            </div>
        </React.Fragment>
    );
};

export default UserRegistration;
