package controllers;

import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import beans.Auction;
import dao.AuctionDAO;
import utilities.ConnectionHandler;
import utilities.LocalDateTimeTypeAdapter;

@WebServlet("/SearchAuctionRIA")
@MultipartConfig
public class SearchAuctionRIA extends HttpServlet {
	@Serial
	private static final long serialVersionUID = 1L;
	private Connection connection = null;

	public SearchAuctionRIA() {
		super();
	}

	/**
	 * Initializes the configuration of the servlet, of the thymeleaf engine and
	 * connects to the database
	 */
	public void init() throws ServletException {
		connection = ConnectionHandler.getConnection(getServletContext());
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

	private boolean validateKey(String key) {
		// checks if the key contains only letters and its length is between 3 and 20
		// characters
		return key.matches("[a-zA-Z]+") && key.length() > 2 && key.length() < 21;
	}

	private void setupPage(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String key = request.getParameter("key");

		List<Auction> keyAuctions = null;

		// checks if the connection is active
		if (checkConnection(connection)) {
			AuctionDAO auc = new AuctionDAO(connection);

			if (key != null) {
				if (validateKey(key)) {
					try {
						// retrieves all the auctions with articles that contain the keyword
						keyAuctions = auc.searchByKeyword(key);
					} catch (SQLException e) {
						e.printStackTrace();
						response.getWriter().println("Errore: accesso al database fallito!");
						response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
						return;
					}
				} else {
					response.getWriter().println(
							"Errore: la chiave deve essere lunga tra 3 e 20 caratteri e può contenere solo lettere non accentate!");
					response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
					return;
				}
			}

			Gson gson = new GsonBuilder().registerTypeAdapter(LocalDateTime.class, new LocalDateTimeTypeAdapter())
					.create();
			String json;
			
			if (keyAuctions.size() != 0) {
				json = gson.toJson(keyAuctions);
			} else {
				String noAuc = "No auctions found";
				json = gson.toJson(noAuc);
			}

			response.setStatus(HttpServletResponse.SC_OK);
			response.setContentType("application/json");
			response.setCharacterEncoding("UTF-8");
			response.getWriter().write(json);
		}
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		// checks if the session does not exist or is expired
		if (request.getSession(false) == null || request.getSession(false).getAttribute("user") == null) {
			String loginPath = getServletContext().getContextPath() + "/index.html";
			response.setStatus(HttpServletResponse.SC_FORBIDDEN);
			response.setHeader("Location", loginPath);
		} else {
			setupPage(request, response);
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		doGet(request, response);
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