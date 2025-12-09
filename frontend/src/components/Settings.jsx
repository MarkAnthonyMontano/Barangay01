// src/components/Settings.jsx
import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Input,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import { SettingsContext } from "../App";

const API_BASE_URL = "http://localhost:5000";

function Settings({ onUpdate }) {
  const settings = useContext(SettingsContext);

  const [companyName, setCompanyName] = useState(settings.company_name || "");
  const [address, setAddress] = useState(settings.address || "");
  const [footerText, setFooterText] = useState(settings.footer_text || "");
  const [headerColor, setHeaderColor] = useState(settings.header_color || "#ffffff");
  const [footerColor, setFooterColor] = useState(settings.footer_color || "#ffffff");
  const [mainButtonColor, setMainButtonColor] = useState(settings.main_button_color || "#ffffff");
  const [sidebarButtonColor, setSidebarButtonColor] = useState(settings.sidebar_button_color || "#000000");

  const [logo, setLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(settings.logo_url ? `${API_BASE_URL}${settings.logo_url}` : null);
  const [bgImage, setBgImage] = useState(null);
  const [previewBg, setPreviewBg] = useState(settings.bg_image ? `${API_BASE_URL}${settings.bg_image}` : null);

  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const handleCloseSnack = (_, reason) => {
    if (reason !== "clickaway") setSnack(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("company_name", companyName);
    formData.append("address", address);
    formData.append("footer_text", footerText);
    formData.append("header_color", headerColor);
    formData.append("footer_color", footerColor);
    formData.append("main_button_color", mainButtonColor);
    formData.append("sidebar_button_color", sidebarButtonColor);
    if (logo) formData.append("logo", logo);
    if (bgImage) formData.append("bg_image", bgImage);

    try {
      await axios.post(`${API_BASE_URL}/api/settings`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSnack({ open: true, message: "Settings updated successfully!", severity: "success" });
      onUpdate?.(); // reload settings in App.jsx
    } catch (err) {
      setSnack({ open: true, message: "Error updating settings", severity: "error" });
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Paper sx={{ p: 3, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 5 }}>
        
        {/* Left column: Info */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} fullWidth size="small" />
          <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth size="small" />
          <TextField label="Footer Text" value={footerText} onChange={e => setFooterText(e.target.value)} fullWidth size="small" />

          <Box>
            <InputLabel>Logo:</InputLabel>
            <Button variant="contained" component="label">
              Upload Logo
              <input type="file" hidden accept="image/*" onChange={e => {
                setLogo(e.target.files[0]);
                setPreviewLogo(URL.createObjectURL(e.target.files[0]));
              }} />
            </Button>
            {previewLogo && <Box component="img" src={previewLogo} sx={{ width: 100, mt: 1 }} />}
          </Box>

          <Box>
            <InputLabel>Background Image:</InputLabel>
            <Button variant="contained" component="label">
              Upload Background
              <input type="file" hidden accept="image/*" onChange={e => {
                setBgImage(e.target.files[0]);
                setPreviewBg(URL.createObjectURL(e.target.files[0]));
              }} />
            </Button>
            {previewBg && <Box component="img" src={previewBg} sx={{ width: "100%", height: 200, mt: 1, objectFit: "cover" }} />}
          </Box>
        </Box>

        {/* Right column: Colors */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Header Color", value: headerColor, setter: setHeaderColor },
            { label: "Footer Color", value: footerColor, setter: setFooterColor },
            { label: "Main Button Color", value: mainButtonColor, setter: setMainButtonColor },
            { label: "Sidebar Button Color", value: sidebarButtonColor, setter: setSidebarButtonColor },
          ].map(c => (
            <Box key={c.label}>
              <InputLabel>{c.label}:</InputLabel>
              <Input type="color" value={c.value} onChange={e => c.setter(e.target.value)} sx={{ width: "100%", height: 50, mt: 1 }} />
            </Box>
          ))}

          <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>Save Settings</Button>
        </Box>
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleCloseSnack} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={handleCloseSnack}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings;
