import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";

import BagongPilipinas from "../assets/BagongPilipinas.png";
import Barangay369 from "../assets/Barangay369.jpg";
import LungsodngManila from "../assets/LungsodngManila.jpg";
import api from "../api";

const API_ROOT = "http://localhost:5000"; // <-- same as your OfficialsPage.jsx

const ResidentIDCard = ({ resident }) => {
    if (!resident) return null;

    const [officials, setOfficials] = useState([]);
    const [captainName, setCaptainName] = useState("");
    const [secretaryName, setSecretaryName] = useState("");

    /** LOAD OFFICIALS ONCE */
    useEffect(() => {
        const fetchOfficials = async () => {
            try {
                const res = await api.get("/officials");
                setOfficials(res.data || []);
            } catch (e) {
                console.error("Failed to load officials", e);
            }
        };
        fetchOfficials();
    }, []);

    /** AUTO-SET CAPTAIN + SECRETARY */
    useEffect(() => {
        if (!officials.length) return;

        const captain =
            officials.find((o) => o.is_captain || o.position === "Punong Barangay") || null;

        const secretary =
            officials.find((o) => o.is_secretary || o.position === "Barangay Secretary") || null;

        if (captain) setCaptainName(captain.full_name);
        if (secretary) setSecretaryName(secretary.full_name);
    }, [officials]);

    /** CAPTAIN PROFILE IMAGE */
    const captainOfficial = useMemo(
        () =>
            officials.find((o) => o.is_captain || o.position === "Punong Barangay") || null,
        [officials]
    );

    const captainProfileUrl = captainOfficial?.profile_img
        ? captainOfficial.profile_img.startsWith("http")
            ? captainOfficial.profile_img
            : `${API_ROOT}${captainOfficial.profile_img.startsWith("/") ? "" : "/"}${captainOfficial.profile_img}`
        : null;

    return (
        <Box>

            {/* ========================== */}
            {/*        FRONT SIDE          */}
            {/* ========================== */}
            <Box
                sx={{
                    width: 340,
                    height: 210,
                    borderRadius: "6px",
                    border: "1px solid #000",
                    bgcolor: "white",
                    overflow: "hidden",
                    fontFamily: "Arial",
                    p: 1,
                    mb: 3,
                }}
            >

                {/* TOP LOGOS — EXACT LIKE SAMPLE */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 2,
                        mt: 0.5,
                    }}
                >
                    <img src={Barangay369} width={45} />
                    <img src={BagongPilipinas} width={55} />
                </Box>

                {/* HEADER TEXT */}
                <Box sx={{ textAlign: "center", mt: -7 }}>
                    <Typography sx={{ fontSize: "10px", fontWeight: "bold" }}>
                        Republic of the Philippines
                    </Typography>

                    <Typography sx={{ fontSize: "10px" }}>City of Manila</Typography>

                    <Typography sx={{ fontSize: "10px", fontWeight: "bold" }}>
                        BARANGAY 369 ZONE 37
                    </Typography>

                    <Typography sx={{ fontSize: "10px" }}>District 3</Typography>
                </Box>

                {/* GREEN BAR */}
                <Box
                    sx={{
                        width: "100%",
                        backgroundColor: "#0a7300",
                        borderRadius: "5px",
                        mt: 0.6,
                        py: 0.4,
                    }}
                >
                    <Typography
                        sx={{
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                            textAlign: "center",
                            letterSpacing: "0.4px",
                        }}
                    >
                        BARANGAY RESIDENT IDENTIFICATION CARD
                    </Typography>
                </Box>

                {/* BODY CONTENT */}
                <Box sx={{ display: "flex", mt: 1 }}>

                    {/* PHOTO */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Box
                            sx={{
                                width: 75,
                                height: 85,
                                border: "1px solid black",
                                borderRadius: "4px",
                                overflow: "hidden",
                                bgcolor: "#d9d9d9",
                            }}
                        />

                        {/* SIGNATURE */}
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: "8px", textAlign: "center" }}>
                                ______________________
                            </Typography>
                            <Typography sx={{ fontSize: "7px", textAlign: "center" }}>
                                SIGNATURE
                            </Typography>
                        </Box>
                    </Box>

                    {/* DETAILS RIGHT SIDE */}
                    <Box sx={{ ml: 2 }}>
                        <Typography sx={{ fontSize: "11px" }}>
                            <b>SURNAME:</b> {resident.last_name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px" }}>
                            <b>GIVEN NAME:</b> {resident.first_name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px" }}>
                            <b>MIDDLE NAME:</b> {resident.middle_name || "N/A"}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", maxWidth: 180 }}>
                            <b>ADDRESS:</b> {resident.address}
                        </Typography>
                        <Typography sx={{ fontSize: "11px" }}>
                            <b>DATE OF BIRTH:</b> {resident.birthdate}
                        </Typography>
                    </Box>
                </Box>

                {/* BOTTOM */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        px: 1,
                        mt: 1,
                    }}
                >
                    <Box>
                        <Typography sx={{ fontSize: "9px" }}>
                            DATE ISSUED: 01-01-2025
                        </Typography>
                        <Typography sx={{ fontSize: "9px" }}>
                            VALID UNTIL: END OF TERM
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                        <img src={LungsodngManila} width={35} />
                        <Typography sx={{ fontSize: "9px", mt: 0.3 }}>
                            ID No. {String(resident.id).padStart(4, "0")}
                        </Typography>
                    </Box>
                </Box>

            </Box>

            {/* ========================== */}
            {/*        BACK SIDE           */}
            {/* ========================== */}
            <Box
                sx={{
                    width: 340,
                    height: 210,
                    borderRadius: "10px",
                    border: "1px solid #000",
                    overflow: "hidden",
                    fontFamily: "Arial",
                    background: "linear-gradient(to right, #c1e8c0, #0a7300)",
                    p: 1,
                }}
            >

                <Box sx={{ display: "flex", height: "100%" }}>

                    {/* LEFT CAPTAIN PHOTO */}
                    <Box
                        sx={{
                            width: 130,
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                        }}
                    >
                        <Box
                            sx={{
                                width: 110,
                                height: 130,
                                borderRadius: "6px",
                                overflow: "hidden",
                                bgcolor: "#ddd",
                                border: "1px solid black",
                                position: "relative",
                            }}
                        >
                            {captainProfileUrl ? (
                                <img
                                    src={captainProfileUrl}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <Typography
                                    sx={{
                                        fontSize: "8px",
                                        color: "gray",
                                        textAlign: "center",
                                        mt: 5,
                                    }}
                                >
                                    No Photo
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* RIGHT SIDE */}
                    <Box sx={{ flex: 1, pr: 1, mt: 0.5 }}>

                        {/* BARANGAY LOGO CENTER */}
                        <Box sx={{ display: "flex", justifyContent: "center", ml: "-120px" }}>
                            <img src={Barangay369} width={70} style={{ borderRadius: "50%" }} />
                        </Box>

                        {/* DESCRIPTION */}
                        <Typography sx={{ fontSize: "8.5px", mt: 0.5, textAlign: "justify" }}>
                            This Barangay Identification Card (ID) hereby certifies that the bearer
                            is a recognised resident of this Barangay. This ID is non-transferable
                            and is to be used by the named individual for identification purposes
                            within the community and for accessing local services and benefits.
                            Any misuse or fraudulent use of this ID will result in legal action.
                        </Typography>

                        {/* CAPTAIN NAME */}
                        <Box sx={{ textAlign: "center", mt: 1, ml: "-330px" }}>
                            <Typography sx={{ fontSize: "9px", fontWeight: "bold" }}>
                                {captainName || "PUNONG BARANGAY"}
                            </Typography>
                            <Typography sx={{ fontSize: "8px", mt: -0.5 }}>CHAIRMAN</Typography>
                        </Box>

                        {/* EMERGENCY CONTACT BOX */}
                        <Box
                            sx={{
                                bgcolor: "white",
                                borderRadius: "3px",
                                border: "1px solid black",
                                px: 0.5,
                                py: 0.2,
                                mt: -3,
                            }}
                        >
                            <Typography sx={{ fontSize: "7.5px", fontWeight: "bold" }}>
                                CONTACT IN CASE OF EMERGENCY
                            </Typography>
                            <Typography sx={{ fontSize: "7px" }}>
                                NAME: ROCHELE DELOS SANTOS
                            </Typography>
                            <Typography sx={{ fontSize: "7px" }}>
                                PHONE NUMBER: 09151822528
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ResidentIDCard;
