import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";
import ProductDetailsDialog from "./ProductDetailsDialog";
import LoginDialog from "./LoginDialog";

const MainPage = () => {
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userId, setUserId] = useState(null); // To store logged in user ID
  const [season, setSeason] = useState("Winter");

  // Separate state for menus
  const [seasonAnchorEl, setSeasonAnchorEl] = useState(null);
  const [userAnchorEl, setUserAnchorEl] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true); // Tracks login status check
  const [loginChecked, setLoginChecked] = useState(false); // Ensures login check is fully completed

  // Fetch user login status on mount
  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/check-login") // http://127.0.0.1:5000/
      .then((response) => {
        if (response.data.logged_in) {
          setUserId(response.data.userId);
        } else {
          setUserId(null);
        }
      })
      .catch((error) => {
        console.error("Error checking login status", error);
      })
      .finally(() => {
        setLoadingUser(false);
        setLoginChecked(true);
      });
  }, []); // Runs only once when component mounts

  // Fetch user-based recommendations when userId is set
  useEffect(() => {
    if (userId) {
      // Runs only when userId is set
      setLoadingProducts(true);
      axios
        .get("http://127.0.0.1:5000/user-recommendations", {
          params: { season: season }, // Include the season parameter
        })
        .then((response) => {
          setProducts(response.data);
          setDisplayedProducts(response.data);
          console.log("User recommendations:", response.data);
        })
        .catch((error) => {
          console.error("Error fetching user recommendations", error);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }
  }, [userId, season]); // Runs when userId updates

  // Fetch seasonal recommendations only if login check is complete and user is NOT logged in
  useEffect(() => {
    if (loginChecked && !userId) {
      setLoadingProducts(true);
      axios
        .get(
          `http://127.0.0.1:5000/season-recommendations?season=${season}`,
          {}
        )
        .then((response) => {
          setProducts(response.data);
          setDisplayedProducts(response.data);
          console.log("Seasonal recommendations:", response.data);
        })
        .catch((error) => {
          console.error("Error fetching seasonal recommendations", error);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }
  }, [season, loginChecked, userId]); // Runs when season, loginChecked, or userId changes

  // Function to load more products (4 at a time)
  const loadMoreProducts = () => {
    setLoadMore(true);
    axios
      .get(`http://127.0.0.1:5000/season-recommendations`, {
        params: { season: season, offset: index + 8, limit: 4 },
      })
      .then((response) => {
        const newProducts = response.data;
        console.log("End:", response.data);
        setProducts((prevProducts) => [...prevProducts, ...newProducts]);
        setDisplayedProducts((prevDisplayed) => [
          ...prevDisplayed,
          ...newProducts,
        ]);
        setIndex((prevIndex) => prevIndex + 4);
        setLoadMore(false);
      })
      .catch((error) => {
        console.error("Error fetching more products", error);
        setLoadMore(false);
      });
  };

  const loadMoreProductsLoggedIn = () => {
    setLoadMore(true);
    axios
      .get("http://127.0.0.1:5000/user-recommendations", {
        params: { num_recommendations: 4, offset: index, season: season }, // Include an offset
      })
      .then((response) => {
        const newProducts = response.data;

        // Filter out duplicates
        const uniqueNewProducts = newProducts.filter(
          (newProduct) =>
            !products.some(
              (product) => product.ProductID === newProduct.ProductID
            )
        );

        if (uniqueNewProducts.length > 0) {
          setProducts((prevProducts) => [
            ...prevProducts,
            ...uniqueNewProducts,
          ]);
          setDisplayedProducts((prevDisplayed) => [
            ...prevDisplayed,
            ...uniqueNewProducts,
          ]);
          setIndex((prevIndex) => prevIndex + uniqueNewProducts.length);
        }

        setLoadMore(false);
      })
      .catch((error) => {
        console.error("Error fetching more user recommendations", error);
        setLoadMore(false);
      });
  };

  const handleLoadMore = () => {
    if (userId) {
      loadMoreProductsLoggedIn();
    } else {
      loadMoreProducts();
    }
  };

  const handleLogin = (loggedInUserId) => {
    // Set logged in user ID
    setUserId(loggedInUserId);

    // Reset state and refetch data
    setProducts([]);
    setDisplayedProducts([]);
    setLoadingProducts(true);
    setIndex(0);
  };

  const handleLogout = () => {
    axios
      .post("http://127.0.0.1:5000/logout")
      .then((response) => {
        if (response.data.success) {
          setUserId(null); // Clear the user ID in the frontend state
          setUserAnchorEl(null); // Close the menu if it's open
          window.location.reload(); // Reload the page
        }
      })
      .catch((error) => {
        console.error("Error logging out", error);
      });
  };

  // Mapping of categories to image URLs
  const categoryImages = {
    Electronics: "https://rb.gy/6stoqt",
    Clothing: "https://rb.gy/jdswd0",
    "Home Decor": "https://rb.gy/e29hbt",
    Books: "https://rb.gy/01h915",
    Beauty: "https://rb.gy/av5pr9",
    "Home & Kitchen": "https://shorturl.at/tNMc3",
    "Sports & Outdoors": "https://shorturl.at/aPQLf",
    Groceries: "https://shorturl.at/ybvbF",
    "Toys & Games": "https://shorturl.at/navE9",
    Fashion: "https://shorturl.at/pwWtG",
    Automotive: "https://tinyurl.com/49vy7y73",
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflowX: "hidden",
        width: "100%",
      }}
    >
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          background: "linear-gradient(45deg, #3f51b5, #5c6bc0)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          padding: "0.5rem 0",
          zIndex: 1200,
        }}
      >
        <Toolbar>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#fff",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            The Grand Mall
          </Typography>

          {/* Push Season and Login button to the right */}
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Season Button */}
            <Button
              onClick={(e) => setSeasonAnchorEl(e.currentTarget)}
              sx={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "none",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                borderRadius: "20px",
                padding: "6px 16px",
                minWidth: "auto",
              }}
            >
              Season: {season}
            </Button>
            {/* Dropdown menu */}
            <Menu
              anchorEl={seasonAnchorEl}
              open={Boolean(seasonAnchorEl)}
              onClose={() => setSeasonAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              {["Winter", "Summer", "Spring", "Monsoon", "Autumn"].map((s) => (
                <MenuItem
                  key={s}
                  onClick={() => {
                    setSeason(s);
                    setSeasonAnchorEl(null);
                  }}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor:
                      season === s ? "rgba(0, 150, 255, 0.2)" : "transparent",
                  }}
                >
                  {s}
                  {season === s && (
                    <CheckIcon sx={{ color: "green", fontSize: "16px" }} />
                  )}
                </MenuItem>
              ))}
            </Menu>

            {/* Login / User Button */}
            {userId ? (
              <>
                <Button
                  sx={{
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                    borderRadius: "20px",
                    padding: "6px 16px",
                  }}
                  onClick={(e) => setUserAnchorEl(e.currentTarget)}
                >
                  User: {userId}
                </Button>
                <Menu
                  anchorEl={userAnchorEl}
                  open={Boolean(userAnchorEl)}
                  onClose={() => setUserAnchorEl(null)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                  borderRadius: "20px",
                  padding: "6px 16px",
                }}
                onClick={() => setLoginOpen(true)}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#f5f7fa",
          padding: 2,
          boxSizing: "border-box",
          overflowY: "auto", // Enable vertical scrolling
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {loadingProducts ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress sx={{ color: "#3f51b5" }} />
          </Box>
        ) : (
          <Grid
            container
            spacing={2}
            sx={{ width: "100%", margin: "0 auto", paddingTop: 10 }}
          >
            {displayedProducts.map((product) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                key={product.ProductID}
              >
                <Card
                  sx={{
                    width: "100%",
                    maxWidth: "310px", // Limit card width
                    margin: "0 auto", // Center cards
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    height: "210px",
                    transition: "box-shadow 0.3s ease-in-out",
                    "&:hover": {
                      boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)", // Darker edges on hover
                      "& .product-id": {
                        color: "blue", // Product ID turns blue on hover
                      },
                    },
                  }}
                >
                  <CardContent sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        gutterBottom
                        variant="h5"
                        sx={{ fontWeight: "bold" }}
                        className="product-id"
                      >
                        {product.ProductID}
                      </Typography>
                      <Chip
                        label={product.Category}
                        sx={{
                          mb: 1,
                          backgroundColor: "yellow",
                          color: "green",
                          fontWeight: "bold",
                          "& .MuiChip-label": { color: "green" }, // Ensures the text color is applied properly
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "15px", color: "text.secondary" }}
                      >
                        Brand: {product.Brand}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#e74c3c", fontWeight: "bold" }}
                      >
                        Price: ₹{product["Price (INR)"]}
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{
                          mt: 2,
                          borderRadius: "20px",
                          background:
                            "linear-gradient(45deg, #3498db, #8e44ad)",
                          color: "#fff",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #2980b9, #6c3483)",
                          },
                        }}
                        onClick={() => setSelectedProduct(product)}
                      >
                        View Details
                      </Button>
                    </Box>
                    <Box sx={{ width: 100, height: 170, marginLeft: 2 }}>
                      <img
                        src={
                          categoryImages[product.Category] ||
                          `https://dummyimage.com/200x140/cccccc/000000&text=${encodeURIComponent(
                            rec.ProductID
                          )}`
                        }
                        alt={product.ProductID}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Load More Button */}
        {index < products.length && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 4,
              pb: 2,
            }}
          >
            {loadMore ? (
              <CircularProgress size={30} sx={{ color: "#3f51b5", mb: 2 }} />
            ) : (
              <Button
                variant="contained"
                onClick={handleLoadMore}
                sx={{
                  backgroundColor: "#3f51b5",
                  "&:hover": { backgroundColor: "#5c6bc0" },
                  borderRadius: "20px",
                  padding: "10px 24px",
                }}
              >
                Load More
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Login Dialog */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
      />
    </Box>
  );
};

export default MainPage;
