import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, InputAdornment, TextField, Typography, useTheme, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Background from '../components/Background.jsx';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import SearchIcon from "@mui/icons-material/Search.js";
import MovieListTable from "../components/MovieListTable.jsx";

const HOST = import.meta.env.VITE_HOST;
export default function MovieList() {
    const [title, setTitle] = useState("");
    const [year, setYear] = useState("");
    const [director, setDirector] = useState("");
    const [star, setStar] = useState("");
    const [movies, setMovies] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortRule, setSortRule] = useState("title_asc_rating_asc");
    const location = useLocation();
    const navigate = useNavigate();

    async function totalPrice() {
        try {
            console.log("attempting to get total price");
            const response = await fetch(`http://${HOST}:8080/fabFlix/totalPrice`,{
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Response is not status 200');
                return;
            }
            const data = await response.json();
            console.log("TOTAL : " + data.total);
            // setTotal(data.total);
        } catch (error) {
            console.error('Error Calculating Total Price: ', error);
        }
    }

    async function shoppingCart() {
        try {
            console.log("getting the whole shopping cart ");
            const response = await fetch(`http://${HOST}:8080/fabFlix/shoppingCart`,{
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Response is not status 200');
                return;
            }
            const data = await response.json();
            //iterate through the data json array and put it on the screen
            for (const title in data){
                console.log(`movie title : ${title} ${JSON.stringify(data[title])}`);
            }


        } catch (error) {
            console.error('Error Calculating Total Price: ', error);
        }
    }
    async function addToShoppingCart(movie){
        try {
            console.log("the movie that was added is : " + movie.title);
            const response = await fetch(`http://${HOST}:8080/fabFlix/add`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ "movieTitle": movie.title})
            }); // Replace totalPrice with confirmation when ready

            if (response.status === 401){
                console.log("REDIRECTION FROM MOVIE LIST");
                navigate('/login')
            }else{
                shoppingCart();
                totalPrice();

            }
        } catch (error) {
            console.error('Error adding into cart: ', error);
        }
    }

    async function decrease(){
        try {
            const response = await fetch(`http://${HOST}:8080/fabFlix/subtract`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "movieTitle": "Bigfoot"}),
                credentials: 'include'
            }); // Replace totalPrice with confirmation when ready
            if (!response.ok) {
                console.error('response is not status 200');
            }

            console.log("DATA AS TEXT IN MOVIE LIST " + response.text);

            if (response.status === 401){
                console.log("REDIRECTION FROM MOVIE LIST");
                navigate('/login')
            }else{
                console.log("no need to login");
                if (response.status === 405){
                    console.log("cant decrement 1 or movie doesnt exist");
                }else if (response.status === 200){
                    shoppingCart();
                    totalPrice();
                }
            }
        } catch (error) {
            console.error('Error decreasing from cart: ', error);
        }
    }


    const handleSearch = () => {
        if (!title && !year && !director && !star) {
            console.log('All search fields are empty. No action taken.');
            return;
        }
        navigate('/movielist', { state: { title, year, director, star } });
    };

    const handlePageDropDown = (event) => {
        setPageSize(event.target.value);
        console.log(pageSize);
    };

    const handleSortDropDown = (event) => {
        setSortRule(event.target.value);
        console.log(sortRule);
    };

    const handleNextClick = () => {
        setPage(prevPage => prevPage + 1);
    }
    const handlePrevClick = () => {
        setPage(prevPage => prevPage > 1 ? prevPage - 1 : 1);
    };


    useEffect(() => {

        const fetchData = async () => {
            let endpoint = `http://${HOST}:8080/fabFlix/`;
            let endpointCategory = "";
            let params = { page, pageSize, sortRule };
            let prevSessionFlag = false;

            if (location.state === null){
                console.log("empty search -> use prev session");
                prevSessionFlag = true;
            }

            if(!prevSessionFlag){
                console.log("dont use prev session, update it ");
                if (location.state.title || location.state.year || location.state.director || location.state.star) {
                    endpoint += 'search';
                    endpointCategory = "search";
                    params = { ...params, ...location.state };
                } else if (location.state.genre) {
                    endpoint += 'browse/genre';
                    endpointCategory = "browse/genre";
                    params = { ...params, genre: location.state.genre };
                } else if (location.state.character) {
                    endpoint += 'browse/character';
                    endpointCategory = "browse/character";
                    params = { ...params, character: location.state.character };
                }
            }

            try {
                let tempParams = {...params, "endpoint" : endpointCategory};
                console.log(tempParams);

                try{
                    const prevResponse = await axios.get(`http://${HOST}:8080/fabFlix/previousGetter`,{
                        withCredentials: true,
                        params: tempParams
                    });


                    console.log("status of response: " + prevResponse.status);
                    //if it is 201 or 100 then use the newly updated params
                    if (prevResponse.status === 201 ){
                        console.log("endpoint " + endpoint);
                        console.log("params ", params);
                        try{
                            const response = await axios.get(endpoint, {
                                params: params,
                                withCredentials: true
                            });
                            console.log("Received:", response.data);
                            setMovies(response.data);
                        }catch(error){
                            if (error.response.status === 401){
                                console.log("Unauthorized access: Redirecting to login page");
                                navigate('/login'); // Redirect on specific status code (401)
                            } else {
                                console.error("Error fetching movie list:", error); // Log other errors
                            }
                        }
                    }else if (prevResponse.status === 200){
                        console.log("going to use prev and checking for the prev data");
                        //use the previous given to by prevResponse
                        const prevData = await prevResponse.data;
                        console.log("prev data ", prevData);

                        const prevEndpoint = Object.keys(prevData)
                        console.log("prev data endpoint " + prevEndpoint[0]);

                        const prevParams = {};
                        let browseEndpoint = "";

                        if (prevEndpoint[0].length > 8){
                            console.log("ignoring the browse: " + prevEndpoint[0].slice(6, prevEndpoint[0].length));
                        }
                        if (prevEndpoint[0] === "search"){
                            console.log("end point is search");
                            for (const key in prevData.search) {
                                prevParams[key] = prevData.search[key];
                            }
                        }
                        else if (prevEndpoint[0].slice(6, prevEndpoint[0].length) === "genre"){
                            console.log("end point is browse/genre");
                            for (const key in prevData.browsegenre) {
                                prevParams[key] = prevData.browsegenre[key];
                            }
                            browseEndpoint = "genre"
                        }else if (prevEndpoint[0].slice(6, prevEndpoint[0].length) === "character"){
                            console.log("end point is browse/character ");
                            for (const key in prevData.browsecharacter) {
                                prevParams[key] = prevData.browsecharacter[key];
                            }
                            browseEndpoint = "character"
                        }


                        console.log("prev params ", prevParams);

                        if (prevData && prevEndpoint && prevParams) {
                            //generating the old end point with the params to get prev data
                            let endpointUrl = "";

                            //if the endpoint is browse, the end point would have been assigned based
                            //on the get request to previousGetter
                            if (browseEndpoint.length >0){

                                endpointUrl = `http://${HOST}:8080/fabFlix/browse/${browseEndpoint}`;
                            }else{
                                endpointUrl = `http://${HOST}:8080/fabFlix/${prevEndpoint}`;
                            }

                            console.log("endpoint url " + endpointUrl);


                            try {
                                const response = await axios.get(endpointUrl,{
                                    params: prevParams,
                                    withCredentials: true
                                });
                                console.log("Received:", response.data);

                                setMovies(response.data);
                            } catch (error) {
                                if (error.response.status === 401){
                                    console.log("Unauthorized access: Redirecting to login page");
                                    navigate('/login'); // Redirect on specific status code (401)
                                } else {
                                    console.error("Error fetching movie list:", error); // Log other errors
                                }                          }
                        } else {
                            console.log("Previous data not available or invalid");
                            try{
                                const oldResponse = await axios.get(endpoint, {
                                    params: params,
                                    withCredentials: true
                                });
                                setMovies(oldResponse.data);
                            }catch(error){
                                if (error.response.status === 401){
                                    console.log("Unauthorized access: Redirecting to login page");
                                    navigate('/login'); // Redirect on specific status code (401)
                                } else {
                                    console.error("Error fetching previous params:", error); // Log other errors
                                }
                            }
                        }
                    }else{
                        console.error("error on server side : previousGetter");
                    }
                }catch(error){
                    console.log("error repsonse " + error);
                    if (error.response.status === 401){
                        console.log("Unauthorized access: Redirecting to login page");
                        navigate('/login'); // Redirect on specific status code (401)
                    } else {
                        console.error("Error fetching previous params:", error); // Log other errors
                    }
                }

            }
            catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [location.state, page, pageSize, sortRule]);

    const theme = useTheme();
    const textFieldStyle = {
        "& .MuiInputBase-input": {
            color: theme.palette.primary.dark,
        },
        "& .MuiInputBase-root": {
            backgroundColor: theme.palette.secondary.light,
        },
    };

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            flexDirection: 'column'
        }}>
            <Navbar />
            <Background sx={{ justifyContent: 'center', alignItems: 'center'}}>
                <Box sx={{
                    display: 'flex',
                    backgroundColor: 'info.light',
                    width: '95vw',
                    height: '85vh',
                    borderRadius: '20px',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <Box sx={{
                        alignSelf: 'flex-start',
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        paddingTop: '1rem',
                        paddingBottom: '.5rem',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                    }}>
                        <TextField
                            placeholder="Title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                ...textFieldStyle,
                                width: '30vw',
                                minWidth: '8rem'
                            }}
                        />
                        <TextField
                            placeholder="Year"
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                ...textFieldStyle,
                                width: '6vw',
                                minWidth: '6rem'
                            }}
                        />
                        <TextField
                            placeholder="Director"
                            value={director}
                            onChange={e => setDirector(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                ...textFieldStyle,
                                width: '15vw',
                                minWidth: '15rem'
                            }}
                        />
                        <TextField
                            placeholder="Star"
                            value={star}
                            onChange={e => setStar(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                ...textFieldStyle,
                                width: '15vw',
                                minWidth: '15rem'
                            }}
                        />
                        <Button
                            onClick={handleSearch}
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'secondary.light',
                                fontWeight: 'bold',
                                fontSize: '1rem',

                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    transform: 'scale(1.05)'
                                }
                            }}>
                            Search
                        </Button>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        width: '95%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '.5rem'
                    }}>
                        <Typography variant='h4' component='h4' color='primary.dark' sx={{
                            fontWeight: 'bold',
                        }}>
                            Results
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Typography sx={{ color: 'primary.dark' }}>
                                Movies Per Page:
                            </Typography>
                            <FormControl variant="outlined" size="small">
                                <Select
                                    value={pageSize}
                                    onChange={handlePageDropDown}
                                    sx={{ minWidth: '5rem' }}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                    <MenuItem value={100}>100</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography sx={{ color: 'primary.dark' }}>
                                Sort By:
                            </Typography>
                            <FormControl variant="outlined" size="small">
                                <Select
                                    value={sortRule}
                                    onChange={handleSortDropDown}
                                    sx={{ minWidth: '5rem' }}
                                >
                                    <MenuItem value={"title_asc_rating_asc"}>Title ↑ / Rating ↑</MenuItem>
                                    <MenuItem value={"title_asc_rating_desc"}>Title ↑ / Rating ↓</MenuItem>
                                    <MenuItem value={"title_desc_rating_asc"}>Title ↓ / Rating ↑</MenuItem>
                                    <MenuItem value={"title_desc_rating_desc"}>Title ↓ / Rating ↓</MenuItem>
                                    <MenuItem value={"rating_asc_title_asc"}>Rating ↑ / Title ↑</MenuItem>
                                    <MenuItem value={"rating_asc_title_desc"}>Rating ↑ / Title ↓</MenuItem>
                                    <MenuItem value={"rating_desc_title_asc"}>Rating ↓ / Title ↑</MenuItem>
                                    <MenuItem value={"rating_desc_title_desc"}>Rating ↓ / Title ↓</MenuItem>
                                </Select>
                            </FormControl>

                        </Box>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        flexGrow: 1,
                        width: '95%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        flexDirection: 'row'
                    }}>
                        <MovieListTable data = {movies} handleAdd={addToShoppingCart}/>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        paddingBottom: '.5rem',
                        paddingTop: '.5rem',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '2rem'
                    }}>
                        <Button sx={{
                            backgroundColor: 'primary.main',
                            color: 'secondary.light',
                            height: '4vh',
                            '&:hover': {
                                backgroundColor: 'primary.dark'
                            }
                        }}
                        onClick={handlePrevClick}
                        >
                            Previous
                        </Button>
                        <Button sx={{
                            backgroundColor: 'primary.main',
                            color: 'secondary.light',
                            height: '4vh',
                            '&:hover': {
                                backgroundColor: 'primary.dark'
                            }
                        }}
                        onClick={handleNextClick}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>
            </Background>
        </Box>
    );
}