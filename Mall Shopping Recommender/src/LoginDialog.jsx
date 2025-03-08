import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";

const LoginDialog = ({ open, onClose, onLogin }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!userId || !password) {
      setError("Both fields are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          password: password,
        }),
      });

      const data = await response.json();
      if (data.valid) {
        onLogin(parseInt(userId));
        onClose();
      } else {
        setError("Invalid User ID or Password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            maxWidth: "400px",
            width: "100%",
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "primary.main",
          borderBottom: "1px solid #e0e0e0",
          pb: 2,
          mb: 2,
        }}
      >
        Login
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pt: 3,
        }}
      >
        <TextField
          label="User ID"
          type="number"
          fullWidth
          variant="outlined"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter a numeric User ID"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
            "& input[type='number']::-webkit-outer-spin-button, & input[type='number']::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
            "& input[type='number']": {
              MozAppearance: "textfield",
            },
            mt: 1,
          }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password as 'users'"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          }}
        />
        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{
              textAlign: "center",
              mt: 1,
            }}
          >
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 3,
          pb: 3,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
