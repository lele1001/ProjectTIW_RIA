package controllers;

import java.io.IOException;
import java.io.InputStream;
import java.io.Serial;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Random;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import beans.User;
import dao.ArticleDAO;
import utilities.ConnectionHandler;

@WebServlet("/CreateArticleRIA")
@MultipartConfig
public class CreateArticleRIA extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;
    String basePath = "";

    public CreateArticleRIA() {
        super();
    }

    /**
     * Initializes the configuration of the servlet and connects to the database
     */
    public void init() throws ServletException {
        ServletContext context = getServletContext();
        connection = ConnectionHandler.getConnection(context);
        basePath = getServletContext().getInitParameter("basePath");
    }

    /**
     * Checks if the connection is active
     */
    private boolean checkConnection(Connection connection) {
        try {
            if (connection != null && !connection.isClosed())
                return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return false;
    }

    private int generateArticleID() throws SQLException {
        Random rand = new Random();
        int code = rand.nextInt(1, 9999);
        ArticleDAO art = new ArticleDAO(connection);

        // checks if the generated code is available for a new auction
        if (art.getArticleByID(code) != null || code > 9999) {
            // generates a new code because the previous one was already in use
            code = generateArticleID();
        }

        // the code is available, so it can be returned
        return code;
    }

    private void createArticle(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        User user = (User) request.getSession(false).getAttribute("user");

        int articleID;
        String name = request.getParameter("name");
        String description = request.getParameter("description");
        float price;

        try {
            articleID = generateArticleID();
        } catch (SQLException e) {
            response.getWriter().println("Errore: ID dell'articolo non creato correttamente!");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }

        Part imagePart = request.getPart("image");
        String fileName;
        String contentType, outputPath;
        
        try {
        	price = Float.parseFloat(request.getParameter("price"));
		} catch (NumberFormatException e) {
			response.getWriter().println("Errore: inserire un intero!");
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return;
		}

        // checks if the connection is active
        if (checkConnection(connection)) {
            if (name == null || name.isBlank() || name.length() < 3 || name.length() > 20) {
                response.getWriter().println("Errore: il nome non rispetta i vincoli richiesti!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (description == null || description.isBlank() || description.length() < 3
                    || description.length() > 100) {
                response.getWriter().println("Errore: la descrizione non rispetta i vincoli richiesti!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (imagePart != null && imagePart.getSize() > 0) {
                contentType = imagePart.getContentType();
                fileName = Paths.get(imagePart.getSubmittedFileName()).getFileName().toString();

                if (!contentType.startsWith("image")) {
                    response.getWriter().println("Errore: formato file non permesso!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }

                outputPath = basePath + fileName;

                try (InputStream fileContent = imagePart.getInputStream()) {
                    Files.copy(fileContent, Paths.get(outputPath));
                } catch (Exception e) {
                    response.getWriter().println("Errore: impossibile salvare il file!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }
            } else {
                response.getWriter().println("Errore: immagine mancante!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (price < 0) {
                response.getWriter().println("Errore: il prezzo deve essere un numero positivo!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            ArticleDAO art = new ArticleDAO(connection);

            try {
                art.createArticle(articleID, user.getUserID(), name, description, fileName, price);
            } catch (SQLException e) {
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            // redirects to sell.html
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // checks if the session does not exist or is expired
        if (request.getSession(false) == null || request.getSession(false).getAttribute("user") == null) {
            String loginPath = getServletContext().getContextPath() + "/index.html";
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader("Location", loginPath);
        } else {
            createArticle(request, response);
        }
    }

    /**
     * Called when the servlet is destroyed
     */
    public void destroy() {
        try {
            ConnectionHandler.closeConnection(connection);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}