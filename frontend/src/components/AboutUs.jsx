import React from "react";
import { Box, Typography, Grid, Avatar, Card, CardContent } from "@mui/material";

export default function AboutUs() {
  return (
    <Box sx={{ p: 4 }}>
      {/* HEADER */}
      <Typography
        variant="h3"
        align="center"
        fontWeight="bold"
        sx={{ mb: 4, fontFamily: "Times New Roman" }}
      >
        ABOUT US
      </Typography>

      {/* VISION */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          mb: 6,
          lineHeight: 2,
          fontSize: "22px",
          fontFamily: "Times New Roman",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 2, fontWeight: "bold", fontFamily: "Times New Roman" }}
        >
          VISION
        </Typography>

        <Typography align="center">
          “To envision a vibrant Barangay 369, an economic hub of God-fearing
          people who enjoy quality of life, thrived in a peaceful sustainable
          environment propelled by proactive governance with highly capacitated
          human resource upholding dignity and integrity.”
        </Typography>
      </Box>

      {/* MISSION */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          mb: 8,
          lineHeight: 2,
          fontSize: "22px",
          fontFamily: "Times New Roman",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 2, fontWeight: "bold", fontFamily: "Times New Roman" }}
        >
          MISSION
        </Typography>

        <Typography align="center">
          “To create a safe and supportive environment where everyone is treated
          fairly, respected, and valued. Through effective governance and
          collaboration, we aspire to build a progressive and prosperous
          barangay that is admired and emulated by others.”
        </Typography>
      </Box>

      {/* BARANGAY OFFICIALS TITLE */}
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        sx={{ mb: 4, fontFamily: "Times New Roman" }}
      >
        BARANGAY OFFICIALS
      </Typography>

      {/* CHAIRMAN */}
      <Box sx={{ maxWidth: 300, mx: "auto", mb: 6 }}>
        <Card
          elevation={4}
          sx={{
            p: 2,
            borderRadius: "16px",
            textAlign: "center",
            fontFamily: "Times New Roman",
          }}
        >
          <Avatar
            src="/org/callanta.png"
            sx={{
              width: 140,
              height: 140,
              mx: "auto",
              mb: 2,
              border: "4px solid #000",
            }}
          />
          <CardContent>
            <Typography fontWeight="bold" sx={{ fontFamily: "Times New Roman" }}>
              Hon. Manolito R. Callanta
            </Typography>
            <Typography sx={{ fontFamily: "Times New Roman" }}>
              Barangay Chairman
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* KAGAWADS ROW 1 */}
      <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
        {[
          {
            name: "Hon. Richard U. Benitez",
            position: "Barangay Kagawad",
            img: "/org/benitez.png",
          },
          {
            name: "Hon. Romulo O. Enrica",
            position: "Barangay Kagawad",
            img: "/org/enrica.png",
          },
          {
            name: "Hon. Kim Louise M. Descuatan",
            position: "Barangay Kagawad",
            img: "/org/descuatan.png",
          },
        ].map((o, i) => (
          <Grid key={i} item xs={12} sm={6} md={4}>
            <Card
              elevation={3}
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: "16px",
                fontFamily: "Times New Roman",
              }}
            >
              <Avatar
                src={o.img}
                sx={{
                  width: 120,
                  height: 120,
                  mx: "auto",
                  mb: 2,
                  border: "4px solid #000",
                }}
              />
              <Typography fontWeight="bold" sx={{ fontFamily: "Times New Roman" }}>
                {o.name}
              </Typography>
              <Typography sx={{ fontFamily: "Times New Roman" }}>
                {o.position}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* KAGAWADS ROW 2 */}
      <Grid container spacing={4} justifyContent="center">
        {[
          {
            name: "Hon. Mercileta A. Runas",
            position: "Barangay Kagawad",
            img: "/org/runas.png",
          },
          {
            name: "Hon. Ramon M. Marcellana",
            position: "Barangay Kagawad",
            img: "/org/marcellana.png",
          },
          {
            name: "Hon. Joel M. Figueroa",
            position: "Barangay Kagawad",
            img: "/org/figueroa.png",
          },
          {
            name: "Hon. Angelito P. Velasco",
            position: "Barangay Kagawad",
            img: "/org/velasco.png",
          },
        ].map((o, i) => (
          <Grid key={i} item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                p: 2,
                textAlign: "center",
                borderRadius: "16px",
                fontFamily: "Times New Roman",
              }}
            >
              <Avatar
                src={o.img}
                sx={{
                  width: 120,
                  height: 120,
                  mx: "auto",
                  mb: 2,
                  border: "4px solid #000",
                }}
              />
              <Typography fontWeight="bold" sx={{ fontFamily: "Times New Roman" }}>
                {o.name}
              </Typography>
              <Typography sx={{ fontFamily: "Times New Roman" }}>
                {o.position}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
