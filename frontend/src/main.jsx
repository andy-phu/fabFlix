import React from 'react'
import ReactDOM from 'react-dom/client';
import App from './App.jsx'
import MovieList from '../src/pages/MovieList.jsx'
import SingleStar from '../src/pages/SingleStar.jsx'
import SingleMovie from '../src/pages/SingleMovie.jsx'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*<App />*/}
      <BrowserRouter>
          <Routes>
              <Route exact path="/" element={<MovieList/>} />
              <Route exact path="/movielist" element={<MovieList/>} />
              <Route exact path="singlemovie" element={<SingleMovie/>} />
              <Route path="/singlestar" element={<SingleStar/>} />

          </Routes>

      </BrowserRouter>
  </React.StrictMode>,
)
