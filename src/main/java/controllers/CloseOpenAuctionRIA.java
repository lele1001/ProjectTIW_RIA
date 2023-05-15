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

import beans.Auction;
import beans.Offer;
import beans.User;
import dao.AuctionDAO;
import dao.OfferDAO;
import utilities.ConnectionHandler;

@WebServlet("/CloseOpenAuctionRIA")
public class CloseOpenAuctionRIA extends HttpServlet {
    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;

    public CloseOpenAuctionRIA() {
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

    /**
     * Before closing the auction, the method checks if the current user is the
     * owner
     */
    private void closeAuction(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        User user = (User) request.getSession(false).getAttribute("user");
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
        Offer maxOffer;
        int winnerID = 0;
        boolean isExpired;

        // checks if the connection is active
        if (checkConnection(connection)) {
            AuctionDAO auc = new AuctionDAO(connection);

            try {
                // retrieves the auction, checks if it is owned by the user, and if the actual
                // time is after the deadline
                auction = auc.getOpenAuctionByID(auctionID);
                isExpired = LocalDateTime.now().isAfter(auction.getExpiryDate());

                if (auction.getOwnerID() != user.getUserID()) {
                    response.getWriter().println("Errore: non puoi chiudere un'asta che non ti appartiene!");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                } else if (!isExpired) {
                    response.getWriter().println("Errore: non puoi chiudere un'asta che non è scaduta!");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } catch (SQLException e) {
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            OfferDAO offerDAO = new OfferDAO(connection);

            try {
                // retrieves the max offer, if exists
                maxOffer = offerDAO.getMaxOffer(auctionID);

                if (maxOffer != null) {
                    winnerID = maxOffer.getUserID();
                }
            } catch (SQLException e) {
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            try {
                auc.closeAuction(auctionID, winnerID);
            } catch (SQLException e) {
                response.getWriter().println("Errore: accesso al database fallito!");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            // returns the updated view
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
            closeAuction(request, response);
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