import React from "react";
import { Box, Typography } from "@mui/material";

import BagongPilipinas from "../assets/BagongPilipinas.png";
import Barangay369 from "../assets/Barangay369.jpg";
import LungsodngManila from "../assets/LungsodngManila.jpg";

const ResidentIDCard = ({ resident }) => {
  if (!resident) return null;

return (
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
    }}
  >

    {/* TOP LOGOS — EXACT LIKE SAMPLE (2 logos only) */}
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

    {/* GREEN HEADER BAR (accurate thickness & curve) */}
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

      {/* TEXT DETAILS RIGHT SIDE */}
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

    {/* BOTTOM FOOTER */}
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

      {/* MANILA SEAL BOTTOM RIGHT */}
      <Box sx={{ textAlign: "right" }}>
        <img src={LungsodngManila} width={35} />
        <Typography sx={{ fontSize: "9px", mt: 0.3 }}>
          ID No. {String(resident.id).padStart(4, "0")}
        </Typography>
      </Box>
    </Box>

  </Box>
);

};

export default ResidentIDCard;
