package controllers;

import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import beans.Auction;
import beans.Offer;
import beans.User;
import dao.AuctionDAO;
import dao.OfferDAO;
import dao.UserDAO;
import utilities.ConnectionHandler;
import utilities.LocalDateTimeTypeAdapter;
import utilities.ObjContainer;

@WebServlet("/ClosedAuctionDetailsRIA")
public class ClosedAuctionDetailsRIA extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;

    public ClosedAuctionDetailsRIA() {
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
        int auctionID = Integer.parseInt(request.getParameter("auctionID"));

        User winner = null;
        Auction closedAuction;
        Offer maxOffer;
        ObjContainer objContainer = new ObjContainer();

        // checks if the connection is active
        if (checkConnection(connection)) {
            AuctionDAO auc = new AuctionDAO(connection);

            try {
                // retrieves the auction
                closedAuction = auc.getClosedAuctionByID(auctionID);
            } catch (SQLException e) {
                e.printStackTrace();
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            if (closedAuction != null) {
                OfferDAO off = new OfferDAO(connection);

                try {
                    // retrieves the maximum offer for the auction
                    maxOffer = off.getMaxOffer(auctionID);
                } catch (SQLException e) {
                    e.printStackTrace();
                    response.getWriter().println("Errore: accesso al database fallito!");
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    return;
                }

                UserDAO us = new UserDAO(connection);

                if (maxOffer != null) {
                    try {
                        // retrieves the user that won the auction
                        winner = us.getUserByID(maxOffer.getUserID());
                    } catch (SQLException e) {
                        e.printStackTrace();
                        response.getWriter().println("Errore: accesso al database fallito!");
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        return;
                    }
                } else {
                	winner = new User(0, "//", "//", "//");
                }
            } else {
                response.getWriter().println("Errore: nessuna asta trovata!");
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            objContainer.setFirstObj(closedAuction);
            objContainer.setSecondObj(winner);

            Gson gson = new GsonBuilder().registerTypeAdapter(LocalDateTime.class, new LocalDateTimeTypeAdapter())
                    .create();
            String json = gson.toJson(objContainer);

            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(json);
        }
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // checks if the session does not exist or is expired
        if (request.getSession(false) == null || request.getSession(false).getAttribute("user") == null) {
            String loginPath = getServletContext().getContextPath() + "/index.html";
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader("Location", loginPath);
        } else if (Integer.parseInt(request.getParameter("auctionID")) > 0) {
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
