package controllers;

import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import beans.Article;
import beans.Auction;
import dao.ArticleDAO;
import dao.AuctionDAO;
import utilities.ConnectionHandler;
import utilities.LocalDateTimeTypeAdapter;

@WebServlet("/AuctionArticlesRIA")
public class AuctionArticlesRIA extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;

    public AuctionArticlesRIA() {
        super();
    }

    /**
     * Initializes the configuration of the servlet, of the thymeleaf engine and
     * connects to the database
     */
    public void init() throws ServletException {
        ServletContext context = getServletContext();
        connection = ConnectionHandler.getConnection(context);
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

    private void setupPage(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        int auctionID;
        
        try {
			auctionID = Integer.parseInt(request.getParameter("auctionID"));
		} catch (NumberFormatException e) {
			response.getWriter().println("Errore: inserire un intero!");
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return;
		}

		if (auctionID < 0) {
			response.getWriter().println("Errore: inserire un intero positivo!");
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			return;
		}

        Auction auction;
        List<Article> articlesList = null;

        // checks if the connection is active
        if (checkConnection(connection)) {
            AuctionDAO auc = new AuctionDAO(connection);

            try {
                // retrieves the auction
                auction = auc.getAuctionByID(auctionID);
            } catch (SQLException e) {
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            if (auction != null) {
                ArticleDAO art = new ArticleDAO(connection);

                try {
                    // retrieves the articles in the auction
                    articlesList = art.getArticlesByAuctionID(auctionID);
                } catch (SQLException e) {
                    response.getWriter().println("Errore: accesso al database fallito!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }

            } else {
                response.getWriter().println("Errore: nessuna asta trovata!");
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
        }

        Gson gson = new GsonBuilder().registerTypeAdapter(LocalDateTime.class, new LocalDateTimeTypeAdapter()).create();
        String json = gson.toJson(articlesList);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // checks if the session does not exist or is expired
        if (request.getSession(false) == null || request.getSession(false).getAttribute("user") == null) {
            String loginPath = getServletContext().getContextPath() + "/index.html";
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader("Location", loginPath);
        } else {
            setupPage(request, response);
        }
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        doPost(request, response);
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
