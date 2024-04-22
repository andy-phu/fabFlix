import jakarta.servlet.ServletConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import com.fasterxml.jackson.databind.ObjectMapper;

@WebServlet("/browse/character")
public class BrowseCharacter extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private DataSource dataSource;

    @Override
    public void init(ServletConfig config) {
        try {
            dataSource = (DataSource) new InitialContext().lookup("java:comp/env/jdbc/moviedb");
        } catch (NamingException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String character = request.getParameter("character");
        if (character == null || character.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"error\": \"Character parameter is required.\"}");
            out.flush();
            return;
        }

        String query = character.equals("*") ?
                "SELECT m.title AS Title, m.year AS Year, m.director AS Director, " +
                        "GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS Genres, " +
                        "GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS Stars, " +
                        "r.rating AS Rating, r.numVotes AS NumVotes " +
                        "FROM movies m " +
                        "LEFT JOIN genres_in_movies gm ON m.id = gm.movieId " +
                        "LEFT JOIN genres g ON gm.genreId = g.id " +
                        "LEFT JOIN stars_in_movies sm ON m.id = sm.movieId " +
                        "LEFT JOIN stars s ON sm.starId = s.id " +
                        "LEFT JOIN ratings r ON m.id = r.movieId " +
                        "WHERE m.title REGEXP '^[^a-zA-Z0-9]' " +
                        "GROUP BY m.id, m.title, m.year, m.director, r.rating, r.numVotes " +
                        "ORDER BY m.title ASC" :
                "SELECT m.title AS Title, m.year AS Year, m.director AS Director, " +
                        "GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS Genres, " +
                        "GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS Stars, " +
                        "r.rating AS Rating, r.numVotes AS NumVotes " +
                        "FROM movies m " +
                        "LEFT JOIN genres_in_movies gm ON m.id = gm.movieId " +
                        "LEFT JOIN genres g ON gm.genreId = g.id " +
                        "LEFT JOIN stars_in_movies sm ON m.id = sm.movieId " +
                        "LEFT JOIN stars s ON sm.starId = s.id " +
                        "LEFT JOIN ratings r ON m.id = r.movieId " +
                        "WHERE m.title LIKE CONCAT(?, '%') " +
                        "GROUP BY m.id, m.title, m.year, m.director, r.rating, r.numVotes " +
                        "ORDER BY m.title ASC";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(query)) {

            if (!character.equals("*")) {
                statement.setString(1, character);
            }

            ResultSet resultSet = statement.executeQuery();
            List<Movie> movies = new ArrayList<>();
            while (resultSet.next()) {
                Movie movie = new Movie();
                movie.setTitle(resultSet.getString("title"));
                movie.setYear(resultSet.getInt("year"));
                movie.setDirector(resultSet.getString("director"));
                movie.setGenres(Arrays.asList(resultSet.getString("genres").split(", ")));
                movie.setStars(Arrays.asList(resultSet.getString("stars").split(", ")));
                movie.setRating(resultSet.getDouble("rating"));
                movie.setNumVotes(resultSet.getInt("numvotes"));
                movies.add(movie);
            }

            ObjectMapper objectMapper = new ObjectMapper();
            out.println(objectMapper.writeValueAsString(movies));
            response.setStatus(HttpServletResponse.SC_OK);

        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"error\": \"Database error: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"error\": \"Server error: " + e.getMessage() + "\"}");
        } finally {
            out.flush();
        }
    }
}
