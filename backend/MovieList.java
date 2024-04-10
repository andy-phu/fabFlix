//import com.google.gson.JsonArray;
//import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

import javax.sql.DataSource;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import jakarta.servlet.ServletConfig;

// This annotation maps this Java Servlet Class to a URL
@WebServlet("/movielist")
public class MovieList extends HttpServlet {
    private static final long serialVersionUID = 1L;

    // Create a dataSource which registered in web.
    private DataSource dataSource;

    public void init(ServletConfig config) {
        try {
            dataSource = (DataSource) new InitialContext().lookup("java:comp/env/jdbc/moviedb");
        } catch (NamingException e) {
            e.printStackTrace();
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {



        // Get the PrintWriter for writing response
        PrintWriter out = response.getWriter();

        // Set response mime type
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "http://localhost:5173");

        try (Connection connection = dataSource.getConnection()){


            // declare statement
            Statement statement = connection.createStatement();
            // prepare query
            String query = "SELECT m.title, m.year, m.director, r.rating, " +
                                "(SELECT GROUP_CONCAT(g.name SEPARATOR ', ')  " +
                                "FROM genres g  " +
                                "JOIN genres_in_movies gm ON gm.genreId = g.id  " +
                                "WHERE gm.movieId = m.id LIMIT 3) AS genres, " +
                                "SUBSTRING_INDEX( " +
                                    "(SELECT GROUP_CONCAT(s.name SEPARATOR ', ')  " +
                                    "FROM stars s  " +
                                    "JOIN stars_in_movies sm ON sm.starId = s.id  " +
                                    "WHERE sm.movieId = m.id), ', ', 3) AS stars " +
                        "FROM movies m " +
                        "JOIN ratings r ON r.movieId = m.id " +
                        "GROUP BY m.id, m.title, m.year, m.director, r.rating " +
                        "ORDER BY r.rating DESC " +
                        "LIMIT 20; ";


//            String query = "SELECT m.title, m.year, m.director, r.rating " +
//                    "FROM movies m " +
//                    "JOIN ratings r ON r.movieId = m.id " +
//                    "JOIN stars_in_movies sm ON sm.movieId = m.id " +
//                    "JOIN stars s ON sm.starId = s.id " +
//                    "GROUP BY m.id, m.title, m.year, m.director, r.rating " +
//                    "ORDER BY r.rating DESC " +
//                    "LIMIT 20";


            // execute query
            ResultSet resultSet = statement.executeQuery(query);

            //holds the json string hashmaps
            List<Map<String, String>> jsonArr = new ArrayList<>();

            while (resultSet.next()) {
                //gets the individual columns for each row and makes them individual strings
                String movieTitle = resultSet.getString("title");
                String year = resultSet.getString("year");
                String movieRating = resultSet.getString("rating");
                String director = resultSet.getString("director");
                String genres = resultSet.getString("genres");
                String stars = resultSet.getString("stars");




                //used to map the strings to their keys to create a json structure
                Map<String, String> data = new LinkedHashMap<>();


                //key is left "____" : val is the right column
                //ex: "title" : movieTitle
                data.put("title", movieTitle);
                data.put("year", year);
                data.put("rating", movieRating);
                data.put("director", director);
                data.put("genres", genres);
                data.put("stars", stars);



                //adds each map into an array
                jsonArr.add(data);

            }

            //jackson api used for turn the hashmap of strings into a string structured like json
            ObjectMapper objMap = new ObjectMapper();

            //structures json so that each object is seperated like normal json struct
            objMap.enable(SerializationFeature.INDENT_OUTPUT);
            ObjectWriter objWrite = objMap.writerWithDefaultPrettyPrinter();

            //turns into json string
            String jsonString = objWrite.writeValueAsString(jsonArr);


            //close database connection when done
            resultSet.close();
            statement.close();

            //the json string will be our json response
            out.print(jsonString);

            response.setStatus(200);

            //flush out the buffer just in case
            out.flush();





        } catch (Exception e) {
            /*
             * After you deploy the WAR file through tomcat manager webpage,
             *   there's no console to see the print messages.
             * Tomcat append all the print messages to the file: tomcat_directory/logs/catalina.out
             *
             * To view the last n lines (for example, 100 lines) of messages you can use:
             *   tail -100 catalina.out
             * This can help you debug your program after deploying it on AWS.
             */
            request.getServletContext().log("Error: ", e);



            out.print(e.getMessage());
            out.flush();
        }



    }



}