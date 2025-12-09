// src/pages/CertificatesPage.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Modal,
  Divider,
} from '@mui/material';
import api from '../api';
import jsPDF from 'jspdf';
import BagongPilipinas from "../assets/BagongPilipinas.png";
import Barangay369 from "../assets/Barangay369.jpg";
import LungsodngManila from "../assets/LungsodngManila.jpg";
import html2canvas from "html2canvas";

const API_ROOT = 'http://localhost:5000';
const CERTIFICATE_TYPES = [
  { value: 'residency', label: 'Certificate of Residency' },
  { value: 'indigency', label: 'Barangay Certificate <br/> of Indigency' },
  { value: 'clearance', label: 'Barangay Certificate' },
];


const CertificatesPage = () => {
  const previewRef = useRef(null);
  const [residents, setResidents] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [certType, setCertType] = useState('residency');
  const [purpose, setPurpose] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [barangayName, setBarangayName] = useState('Barangay 369, Zone 37');
  const [municipality, setMunicipality] = useState('District III');
  const [province, setProvince] = useState('City of Manila');
  const [captainName, setCaptainName] = useState('');
  const [secretaryName, setSecretaryName] = useState('');
  const [placeIssued, setPlaceIssued] = useState('Barangay Hall');
  const [orNumber, setOrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);



  const openCamera = async () => {
    setCameraOpen(true);
    setCapturedImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access camera");
      console.error(err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 800;
    canvas.height = 600;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/png");
    setCapturedImage(data);

    // Stop webcam
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    setPreviewMode(true); // Activate preview mode
  };

  const retakePhoto = async () => {
    setPreviewMode(false);
    setCapturedImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access camera");
      console.error(err);
    }
  };



  // ---- NEW: officials state comes BEFORE effects that use it
  const [officials, setOfficials] = useState([]);

  // Load residents
  useEffect(() => {
    const loadResidents = async () => {
      try {
        const res = await api.get('/residents');
        setResidents(res.data || []);
      } catch (err) {
        console.error('Error loading residents', err);
        setError('Failed to load residents.');
      }
    };
    loadResidents();
  }, []);
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get('/barangay-profile');
        if (res.data) {
          setBarangayName(res.data.barangay_name);
          setMunicipality(res.data.municipality);
          setProvince(res.data.province);
          setPlaceIssued(res.data.place_issued || 'Barangay Hall');
        }
      } catch (err) {
        console.error('Error loading barangay profile', err);
        // optional: setError('Failed to load barangay profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Load officials
  useEffect(() => {
    const loadOfficials = async () => {
      try {
        const res = await api.get('/officials');
        setOfficials(res.data || []);
      } catch (err) {
        console.error('Error loading officials for certificates', err);
      }
    };
    loadOfficials();
  }, []);

  // When officials change, auto-set captain & secretary names
  useEffect(() => {
    if (!officials.length) return;

    const captain =
      officials.find(
        (o) => o.is_captain || o.position === 'Punong Barangay'
      ) || null;
    const secretary =
      officials.find(
        (o) => o.is_secretary || o.position === 'Barangay Secretary'
      ) || null;

    if (captain) setCaptainName(captain.full_name);
    if (secretary) setSecretaryName(secretary.full_name);
  }, [officials]);

  const selectedResident = useMemo(
    () => residents.find((r) => String(r.id) === String(selectedResidentId)),
    [residents, selectedResidentId]
  );

  const buildFullName = (r) => {
    if (!r) return '';
    const parts = [
      r.first_name,
      r.middle_name ? `${r.middle_name.charAt(0)}.` : '',
      r.last_name,
      r.suffix || '',
    ].filter(Boolean);
    return parts.join(' ');
  };





  const captainOfficial = useMemo(() => {
    return officials.find(
      (o) => o.is_captain || o.position === "Punong Barangay"
    ) || null;
  }, [officials]);

  // Build safe image URL
  const captainProfileUrl = captainOfficial?.profile_img
    ? captainOfficial.profile_img.startsWith("http")
      ? captainOfficial.profile_img
      : `${API_ROOT}${captainOfficial.profile_img.startsWith("/") ? "" : "/"}${captainOfficial.profile_img}`
    : null;



  const handleGeneratePdf = async () => {
    if (!selectedResident) {
      setError("Please select a resident.");
      return;
    }

    const element = previewRef.current; // your full preview
    const canvas = await html2canvas(element, {
      scale: 2, // high quality
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("barangay_certificate.pdf");
  };


  const cameraModal = (
    <Modal open={cameraOpen} onClose={() => setCameraOpen(false)}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          p: 3,
          borderRadius: 2,
          boxShadow: 24,
          width: 650,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {previewMode ? "Captured Photo" : "Camera Preview"}
        </Typography>

        {/* If NOT yet captured → show video */}
        {!previewMode && (
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: "100%",
              borderRadius: "10px",
            }}
          />
        )}

        {/* If already captured → show captured image */}
        {previewMode && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            style={{
              width: "100%",
              borderRadius: "10px",
            }}
          />
        )}

        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {/* Buttons */}
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
          {!previewMode ? (
            <Button variant="contained" onClick={capturePhoto}>
              Capture Photo
            </Button>
          ) : (
            <>
              <Button variant="outlined" sx={{ backgroundColor: "#800000", color: "white" }} onClick={retakePhoto}>
                Retake Photo
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setPreviewMode(false);
                  setCameraOpen(false);
                }}
              >
                Use Photo
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );


  return (

    <Box>
      {cameraModal}
      <Typography variant="h5" gutterBottom>
        Barangay Certificates
      </Typography>

      <Grid container spacing={2}>
        {/* Left side: form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Resident & Certificate Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Resident"
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  fullWidth
                  required
                >
                  {residents.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.last_name}, {r.first_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  label="Certificate Type"
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  fullWidth
                >
                  {CERTIFICATE_TYPES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Purpose"
                  placeholder="e.g., employment, scholarship, school requirement"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Place of Issuance"
                  value={placeIssued}
                  onChange={(e) => setPlaceIssued(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="OR Number"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Amount (₱)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: "56px" }}
                  onClick={openCamera}
                >
                  Take Photo
                </Button>
              </Grid>

            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Barangay Header & Officials
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Barangay Name"
                  value={barangayName}
                  onChange={(e) => setBarangayName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Municipality / City"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Punong Barangay"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Barangay Secretary"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Paper>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleGeneratePdf}>
              Generate PDF
            </Button>
          </Box>
        </Grid>

        {/* Right side: preview */}
        <Grid item xs={12} md={6}>
          <Paper ref={previewRef} sx={{ p: 3, minHeight: 400 }} elevation={2}>


            {/* ---- HEADER LOGOS ---- */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <img src={Barangay369} alt="Barangay Logo" style={{ width: 170, height: 160, marginBottom: "-25px", marginLeft: "25px" }} />
              <img src={LungsodngManila} alt="Manila Seal" style={{ width: 140, height: 140, marginTop: "-10px" }} />
              <img src={BagongPilipinas} alt="Bagong Pilipinas" style={{ width: 170, height: 160, marginBottom: "-25px", marginRight: "25px" }} />
            </Box>

            {/* ---- TEXT HEADER ---- */}
            <Typography align="center" sx={{
              fontSize: "28px",
              fontFamily: "Bernard MT", fontWeight: "bold"
            }}>
              Republika ng Pilipinas
            </Typography>

            <Typography align="center" sx={{
              fontSize: "24px",
              fontFamily: "Bernard MT", fontWeight: "bold"
            }}>
              Lungsod ng Maynila
            </Typography>

            <Typography align="center" sx={{
              fontSize: "24px",
              fontFamily: "Bernard MT", fontWeight: "bold", fontWeight: "bold", letterSpacing: 3, color: "red"
            }}>
              BARANGAY 369, ZONE 37, DISTRICT III
            </Typography>

            <Typography align="center" sx={{ fontSize: "15px", fontFamily: "Times New Roman" }}>
              Email address: <span style={{ color: "blue" }}><u>barangay369zone37@gmail.com</u></span>
            </Typography>

            {/* ---- BLUE BAR ---- */}
            <Box
              sx={{
                backgroundColor: "#1b3a8a",
                color: "white",
                textAlign: "center",
                py: 1,
                mt: 1,
                fontFamily: "Times New Roman",
                fontSize: "20px",
                fontWeight: "bold"
              }}
            >
              OFFICE OF THE BARANGAY CHAIRMAN
            </Box>

            <Box
              sx={{
                position: "relative",
                p: 2,
              }}
            >
              {/* --- Watermark (Barangay Logo) --- */}
              <Box
                component="img"
                src={Barangay369}   // your barangay logo
                alt="Watermark"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "80%",
                  height: "90%",
                  opacity: 0.15,
                  transform: "translate(-50%, -50%)",
                  zIndex: 0,
                }}
              />

              <Box sx={{ position: "relative", zIndex: 10, display: "flex" }}>
                {/* LEFT SIDE PANEL */}
                <Box
                  sx={{
                    width: "28%",
                    border: "2px solid #c5c5c5",
                    p: 2,
                    mr: 3,
                    mt: 3,
                    backgroundColor: "transparent",
                    fontFamily: "Arial",
                    fontWeight: "bold"

                  }}
                >
                  <Typography
                    sx={{ textAlign: "center", fontWeight: "bold", color: "#cc0000", letterSpacing: 3, mb: 1, fontWeight: "bold", fontFamily: "Bernard MT", fontSize: "28px" }}
                  >
                    SANGGUNIANG <br />BARANGAY
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: "#003366",
                      fontSize: "14px",
                      textAlign: "center",
                      textDecoration: "underline",
                    }}
                  >
                    {officials.find(o => o.is_captain)?.full_name || ""}
                  </Typography>

                  <Typography sx={{ fontSize: '15px', textTransform: "uppercase", textDecoration: "underline", fontWeight: "bold", color: "navy", fontFamily: "Times new roman", textAlign: "center", }}>
                    {captainName}
                  </Typography>
                  <Typography
                    sx={{ fontWeight: "bold", color: "#cc0000", mb: 2, textAlign: "center", fontFamily: "Times new roman", fontSize: "15px" }}
                  >
                    PUNONG BARANGAY
                  </Typography>
                  {/* Placeholder Photo Box */}
                  <Box
                    sx={{
                      border: "5px solid black",   // OUTER WHITE BORDER
                      p: "5px",                    // spacing so inner border is visible
                      display: "inline-block",
                      marginLeft: "20px"
                    }}
                  >
                    <Box
                      sx={{
                        width: 200,
                        height: 250,
                        border: "1px solid white",   // INNER BLACK BORDER
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                      }}
                    >
                      {captainProfileUrl ? (
                        <img
                          src={captainProfileUrl}
                          alt="Captain Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "";
                          }}
                        />
                      ) : (
                        <Typography variant="caption" color="gray">
                          No Profile
                        </Typography>
                      )}
                    </Box>
                  </Box>


                  {/* Sangguniang Barangay Title */}
                  {/* Chairman Section */}



                  <Typography sx={{ fontWeight: "bold", color: "#cc0000", mt: 2, mb: 1, textAlign: "center", fontFamily: "Times new roman" }}>
                    BARANGAY KAGAWAD
                  </Typography>

                  {officials
                    .filter(o => o.position === 'Barangay Kagawad')
                    .map(o => (
                      <Typography key={o.id} sx={{
                        fontSize: '14px', mb: 1, textTransform: "uppercase", fontWeight: "bold", color: "navy", fontFamily: "Times new roman", textAlign: "center",
                      }}>
                        {o.full_name}
                      </Typography>
                    ))}



                  {officials
                    .filter(o => o.position === 'Sangguniang Kabataan Chairperson')
                    .map(o => (
                      <Typography key={o.id} sx={{ mt: 4, textDecoration: "underline", fontSize: '15px', fontWeight: "bold", color: "navy", fontFamily: "Times new roman", textAlign: "center", }}>
                        {o.full_name}
                      </Typography>
                    ))}
                  <Typography sx={{ fontWeight: "bold", fontSize: '15px', color: "#cc0000", textAlign: "center", fontFamily: "Times new roman" }}>
                    SK CHAIRPERSON
                  </Typography>


                  <Typography sx={{ mt: 1, textDecoration: "underline", fontSize: '15px', fontWeight: "bold", color: "navy", fontFamily: "Times new roman", textAlign: "center", }}>
                    {officials.find(o => o.is_secretary)?.full_name || 'SECRETARY NAME'}
                  </Typography>

                  <Typography sx={{ fontWeight: "bold", fontSize: '15px', color: "#cc0000", textAlign: "center", fontFamily: "Times new roman" }}>
                    SECRETARY
                  </Typography>


                  {/* Barangay Kagawad */}



                  {/* Treasurer */}

                  {officials
                    .filter(o => o.position === 'Barangay Treasurer')
                    .map(o => (
                      <Typography sx={{ mt: 1, textDecoration: "underline", fontSize: '15px', fontWeight: "bold", color: "navy", fontFamily: "Times new roman", textAlign: "center", }}>
                        {o.full_name}
                      </Typography>
                    ))}
                  <Typography sx={{ fontWeight: "bold", fontSize: '15px', color: "#cc0000", textAlign: "center", fontFamily: "Times new roman" }}>
                    TREASURER
                  </Typography>
                </Box>

                {/* RIGHT SIDE CONTENT (Certificate Body) */}
                <Box sx={{ width: "72%", pr: 2 }}>
                  {/* TITLE */}
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "36px",
                      color: "navy",
                      letterSpacing: "3px",
                      mt: 2,
                      fontFamily: "Bernard MT",
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        (CERTIFICATE_TYPES.find(c => c.value === certType)?.label ||
                          "BARANGAY CERTIFICATE"
                        ).toUpperCase(),
                    }}
                  />

                  <Box
                    sx={{
                      mt: 2,
                      fontSize: "19px",
                      fontFamily: "Times New Roman",
                      lineHeight: 1.7,
                    }}
                  >

                    {/* To Whom */}
                    <p style={{ marginBottom: "12px", fontSize: "24px", }}>
                      To Whom It May Concern:
                    </p>

                    {/* Main Body */}
                    <p
                      style={{
                        textAlign: "justify",
                        marginBottom: "12px",
                        fontSize: "24px",
                        textIndent: "45px", // EXACT IMAGE INDENT
                      }}
                    >
                      This is to certify that
                      <span style={{ fontWeight: "bold", textDecoration: "underline" }}>
                        {" "}{buildFullName(selectedResident)?.toUpperCase()}
                      </span>, of legal age, is a bona fide resident of this Barangay
                      with an actual postal address located at
                      <span style={{ textDecoration: "underline", fontWeight: "bold" }}>
                        {" "}{selectedResident?.address}
                      </span>.
                    </p>

                    {/* Purpose */}
                    <p
                      style={{
                        textAlign: "justify",
                        marginBottom: "12px",
                        fontSize: "24px",
                        textIndent: "45px", // SAME AS IMAGE
                      }}
                    >
                      The aforementioned person requested this certification in
                      order to fulfill his/her need for
                      <span style={{ textDecoration: "underline", fontWeight: "bold" }}>
                        {" "}{purpose || ""}
                      </span>.
                    </p>

                    {/* Issued this */}
                    <p
                      style={{
                        textAlign: "justify",
                        marginBottom: "12px",
                        fontSize: "24px",
                        textIndent: "45px", // EXACT SAME INDENT AS IMAGE
                      }}
                    >
                      Issued this
                      <span style={{ textDecoration: "underline", fontWeight: "bold" }}>
                        {" "}
                        {new Date(issueDate).toLocaleDateString("en-PH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>{" "}
                      at Barangay {barangayName}, {municipality}, {province}.
                    </p>

                  </Box>


                  {/* SIGNATURES SECTION */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between", // pushes left + right apart
                      width: "100%",
                      mt: 6,
                      px: 5, // add left & right spacing
                    }}
                  >
                    {/* --- Prepared By (Left Side) --- */}
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ textAlign: "left", marginTop: "180px", mb: 4, fontFamily: "Times new roman", fontSize: "24px" }} variant="body2">
                        Prepared by:
                      </Typography>

                      _____________________________________
                      <Typography sx={{ fontFamily: "Times New Roman", fontWeight: "bold", fontSize: "24px" }}>
                        {secretaryName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "Times new roman", fontSize: "24px" }}>Barangay Secretary</Typography>
                    </Box>

                    {/* --- Certified By (Right Side) --- */}
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ textAlign: "left", marginTop: "50px", mb: 4, fontFamily: "Times new roman", fontSize: "24px" }} variant="body2">
                        Certified by:
                      </Typography>

                      _____________________________________
                      <Typography sx={{ fontFamily: "Times New Roman", fontWeight: "bold", fontSize: "24px" }}>
                        {captainName}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "Times new roman", fontSize: "24px", }}>Barangay Chairman</Typography>
                    </Box>
                  </Box>

                </Box>

              </Box>

            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10, // space between boxes
                mt: 1,
              }}
            >
              {/* Picture Box */}
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    border: "2px solid black",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </Box>
                <Typography sx={{ fontFamily: "Times New Roman", mt: 1 }}>
                  Picture
                </Typography>
              </Box>



              {/* Thumbmark Box */}
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    border: "2px solid black",
                  }}
                />
                <Typography sx={{ fontFamily: "Times New Roman", mt: 1 }}>
                  Thumb Mark
                </Typography>
              </Box>
            </Box>

            {/* --- Note Section --- */}
            <Box
              sx={{
                mt: 4,
                mx: "auto",
                width: "80%",
                border: "1px solid black",
                p: 1,

                textAlign: "center",
              }}
            >
              <Typography sx={{ fontFamily: "Times New Roman", fontSize: "15px" }}>
                <b>Note:</b> This is only valid for six months and requires the Barangay Chairman’s
                signature and the barangay's seal.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

    </Box >
  );
};

export default CertificatesPage;
