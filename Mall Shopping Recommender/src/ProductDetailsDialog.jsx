import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

const ProductDetailsDialog = ({ selectedProduct, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [displayedRecs, setDisplayedRecs] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(selectedProduct);

  // Update currentProduct when parent updates selectedProduct
  useEffect(() => {
    setCurrentProduct(selectedProduct);
  }, [selectedProduct]);

  // Fetch recommendations when a product is selected
  useEffect(() => {
    if (currentProduct) {
      setLoadingRecommendations(true);
      axios
        .get(
          `http://127.0.0.1:5000/recommend?product_id=${currentProduct.ProductID}`,
          { timeout : 120000 }
        )
        .then((response) => {
          // Filter out the current product and limit to 6 recommendations
          const recs = response.data
            .filter((r) => r.ProductID !== currentProduct.ProductID)
            .slice(0, 6);
          setRecommendations(recs);
          setLoadingRecommendations(false);
        })
        .catch((error) => {
          console.error("Error fetching recommendations", error);
          setLoadingRecommendations(false);
        });
    }
  }, [currentProduct]);

  // Gradually load recommendations one by one
  useEffect(() => {
    setDisplayedRecs([]);
    if (recommendations.length === 0) return;
    const timeouts = [];
    recommendations.forEach((rec, index) => {
      const timeout = setTimeout(() => {
        setDisplayedRecs((prev) => [...prev, rec]);
      }, index * 300); // 300ms delay for each item
      timeouts.push(timeout);
    });
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [recommendations]);

  // Handler when a recommendation is clicked
  const handleRecommendationClick = (rec) => {
    // Remove the clicked recommendation from the displayed list
    setDisplayedRecs((prevRecs) =>
      prevRecs.filter((r) => r.ProductID !== rec.ProductID)
    );
    // Update currentProduct to the clicked recommendation
    setCurrentProduct(rec);
  };

  return (
    <Dialog
      open={!!currentProduct}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "#3f51b5",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "1.5rem",
          position: "relative",
        }}
      >
        {currentProduct?.ProductID}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          backgroundColor: "#fdfdfd",
          padding: "24px",
        }}
      >
        {currentProduct && (
          <>
            <Typography variant="h6" gutterBottom sx={{ color: "#ff6f00" }}>
              Category: {currentProduct.Category}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Brand: {currentProduct.Brand}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Features:
            </Typography>
            <Typography
              component="pre"
              variant="body2"
              gutterBottom
              sx={{
                backgroundColor: "#f5f5f5",
                padding: "12px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              {currentProduct.ProductFeatures}
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: "#e91e63" }}>
              Price: ₹{currentProduct["Price (INR)"]}
            </Typography>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ mt: 2, color: "#3f51b5" }}
            >
              Recommended Products:
            </Typography>
            {loadingRecommendations ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100px",
                }}
              >
                <CircularProgress sx={{ color: "#3f51b5" }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {displayedRecs.map((rec) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={rec.ProductID}>
                    <Card
                      sx={{
                        margin: "10px",
                        padding: "10px",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.02)" },
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{
                          width: "40%",
                          objectFit: "cover",
                        }}
                        image={`https://dummyimage.com/200x140/cccccc/000000&text=${encodeURIComponent(
                          rec.ProductID
                        )}`}
                        alt={rec.ProductID}
                      />
                      <CardContent sx={{ width: "60%" }}>
                        <Typography gutterBottom variant="h6">
                          {rec.ProductID}
                        </Typography>
                        <Typography variant="body2">
                          Category: {rec.Category}
                        </Typography>
                        <Typography variant="body2">
                          Brand: {rec.Brand}
                        </Typography>
                        <Typography variant="body2">
                          Price: ₹{rec["Price (INR)"]}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            mt: 1,
                            borderRadius: "20px",
                            backgroundColor: "#3f51b5",
                            "&:hover": { backgroundColor: "#5c6bc0" },
                          }}
                          onClick={() => handleRecommendationClick(rec)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
