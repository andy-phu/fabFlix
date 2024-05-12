import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.PreparedStatement;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

import javax.sql.DataSource;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.http.HttpSession;
import org.jasypt.util.password.StrongPasswordEncryptor;

@WebServlet("/employeeLogin")
public class EmployeeLogin extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private DataSource dataSource;

    public void init(ServletConfig config) {
        try {
            dataSource = (DataSource) new InitialContext().lookup("java:comp/env/jdbc/moviedb");
            System.out.println("EMPLOYEE LOGIN");
        } catch (NamingException e) {
            e.printStackTrace();
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        StringBuilder requestBody = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                requestBody.append(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println("Request Body: " + requestBody.toString());
        ObjectMapper objectMapper = new ObjectMapper();
        User user = objectMapper.readValue(requestBody.toString(), User.class);
        String email = user.getEmail();
        String password = user.getPassword();
        StrongPasswordEncryptor passwordEncryptor = new StrongPasswordEncryptor();

        try {
            Connection connection = dataSource.getConnection();
            String query = "SELECT e.fullname, e.password FROM employees e WHERE e.email = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(query);
            preparedStatement.setString(1, email);

            ResultSet resultSet = preparedStatement.executeQuery();

            if (resultSet.next()) {
                String storedPassword = resultSet.getString("password");
                String fullname = resultSet.getString("fullname");

                if (passwordEncryptor.checkPassword(password, storedPassword)) {
                    HttpSession session = request.getSession();
                    if (session != null) {
                        session.invalidate();
                    }
                    session = request.getSession(true);
                    session.setAttribute("fullname", fullname);

                    response.setContentType("application/json");
                    PrintWriter out = response.getWriter();
                    out.println("{\"fullname\": \"" + fullname + "\"}");
                    out.flush();

                    response.setStatus(HttpServletResponse.SC_OK);
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                }
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            }
            connection.close();
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
