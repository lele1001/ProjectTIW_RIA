package controllers;

import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Random;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import beans.Article;
import beans.User;
import dao.ArticleDAO;
import dao.AuctionDAO;
import utilities.ConnectionHandler;

@WebServlet("/CreateAuctionRIA")
@MultipartConfig
public class CreateAuctionRIA extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;

    public CreateAuctionRIA() {
        super();
    }

    /**
     * Initializes the configuration of the servlet and connects to the database
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

    private int generateAuctionID() throws SQLException {
        Random rand = new Random();
        int code = rand.nextInt(1, 9999);
        AuctionDAO auc = new AuctionDAO(connection);

        // checks if the generated code is available for a new auction or if it is too
        // big
        if (!auc.checkIDAvailability(code) || code > 9999) {
            // generates a new code because the previous one was already in use
            code = generateAuctionID();
        }

        // the code is available, so it can be returned
        return code;
    }

    private void createAuction(HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = (User) request.getSession(false).getAttribute("user");
        String articleIDsStr = request.getParameter("articleIDs");
        String[] articlesIDs;

        int auctionID;

        try {
            auctionID = generateAuctionID();
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().println("Errore: ID dell'asta non creato correttamente!");
            return;
        }

        Article a;
        float price = 0;
        LocalDateTime expiryDate = LocalDateTime.parse(request.getParameter("expiryDate"))
                .truncatedTo(ChronoUnit.MINUTES);
        String title = request.getParameter("title");
        float minIncrease = Float.parseFloat(request.getParameter("minIncrease"));

        // checks if the connection is active
        if (checkConnection(connection)) {
            if (title == null || title.isBlank() || title.length() < 3 || title.length() > 20) {
                response.getWriter().println("Errore: il titolo non rispetta i vincoli richiesti!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (minIncrease < 0) {
                response.getWriter().println("Errore: l'incremento minimo deve essere un numero positivo!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (!expiryDate.isAfter(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES))) {
                response.getWriter().println("Errore: devi inserire una scadenza posteriore alla data attuale!");
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            ArticleDAO art = new ArticleDAO(connection);

            articlesIDs = articleIDsStr.split(",");
            
            for (String s : articlesIDs) {
                int articleID = Integer.parseInt(s);

                try {
                    // retrieves each selected article and checks if its owner is the current user
                    // and if it is associated to another auction
                    a = art.getArticleByID(articleID);

                    if (a.getOwnerID() != user.getUserID()) {
                        response.getWriter().println("Errore: non puoi inserire un'articolo che non ti appartiene!");
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        return;
                    } else if (a.getAuctionID() != 0) {
                        response.getWriter()
                                .println("Errore: non puoi inserire un'articolo presente in un'altra asta!");
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        return;
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    response.getWriter().println("Errore: accesso al database fallito!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }

                price += a.getPrice();

                // associates the article to the auction
                try {
                    art.associateToAuction(articleID, auctionID);
                } catch (SQLException e) {
                    e.printStackTrace();
                    response.getWriter().println("Errore: accesso al database fallito!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }
            }

            AuctionDAO auc = new AuctionDAO(connection);

            try {
                auc.createAuction(auctionID, user.getUserID(), title, price, minIncrease, expiryDate);
            } catch (SQLException e) {
                e.printStackTrace();
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // checks if the session does not exist or is expired
        if (request.getSession(false) == null || request.getSession(false).getAttribute("user") == null) {
            String loginPath = getServletContext().getContextPath() + "/index.html";
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader("Location", loginPath);
        } else {
            createAuction(request, response);
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