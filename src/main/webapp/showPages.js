{
	function WelcomeMessage(username, messageContainer) {
		this.username = username;
		this.show = function() {
			messageContainer.textContent = this.username;
		}
	}

	function Menu() {
		const username = getCookie('username');

		this.registerEvents = (orchestrator) => {
			document.getElementById("sellPage").addEventListener('click', () => {
				setCookie("lastActionBy" + username, "SELL", 30);
				orchestrator.showSell();
			})

			document.getElementById("buyPage").addEventListener('click', () => {
				setCookie("lastActionBy" + username, "BUY", 30);
				orchestrator.showBuy();
			})

			document.getElementById("logoutButton").addEventListener('click', () => {
				makeCall("POST", "LogoutRIA", null, (req) => {
					if (req.readyState === XMLHttpRequest.DONE) {
						switch (req.status) {
							case 200:
								cancelCookie('username');
								window.sessionStorage.removeItem('username');
								window.location.href = "index.html";
								break;
							case 403:
								cancelCookie('username');
								window.location.href = "index.html";
								break;
							default:
								break;
						}
					}
				})
			})
		}
	}

	function SearchForm(alertBox, formContainer) {
		this.alertBox = alertBox;

		this.registerEvent = () => {
			document.getElementById("searchSubmit").addEventListener('click', (e) => {
				this.alertBox.style.display = "none";
				let form = e.target.closest("form");

				if (form.checkValidity()) {
					let self = this;

					makeCall("POST", 'SearchAuctionRIA', form, (req) => {
						if (req.readyState === XMLHttpRequest.DONE) {
							let message = req.responseText;

							switch (req.status) {
								case 200:
									let auctionsList = JSON.parse(req.responseText);

									if (auctionsList === null) {
										alertBox.style.display = "block";
										alertBox.textContent = "No auctions found";
										keyAuctionsList.noAuc();
										return;
									}

									keyAuctionsList.show(auctionsList);
									return;
								case 403:
									cancelCookie('username');
									window.location.href = "index.html";
									break;
								default:
									self.alertBox.style.display = "block";
									self.alertBox.textContent = message;
									break;
							}
						}
					})
				} else {
					form.reportValidity();
				}
			})
		}

		this.hide = () => {
			formContainer.style.display = "none";
		}

		this.show = () => {
			formContainer.style.display = "block";
		}
	}

	/**
	 * Shows the list of the auctions found with the given key
	 */
	function KeyAuctionsList(listContainer, listContainerBody) {
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			document.getElementById("keyAucContainer").style.display = "none";
		}

		this.noAuc = () => {
			document.getElementById("keyAucContainer").style.display = "block";
			listContainer.style.display = "none";
			listContainerBody.style.display = "none";
		}

		this.show = (auctionsList) => {
			document.getElementById("keyAucContainer").style.display = "block";
			listContainer.style.display = "block";
			listContainerBody.style.display = "block";
			document.getElementById("keyAuctions").classList.add('tableArrangement');
			listContainerBody.innerHTML = "";

			let row, aucIDCell, ownIDCell, titleCell, remTimeCell, linkCell, anchor, linkText;
			let self = this;

			auctionsList.forEach((auction) => {
				row = document.createElement("tr");

				aucIDCell = document.createElement("td");
				aucIDCell.textContent = auction.auctionID;
				row.appendChild(aucIDCell);

				ownIDCell = document.createElement("td");
				ownIDCell.textContent = auction.ownerID;
				row.appendChild(ownIDCell);

				titleCell = document.createElement("td");
				titleCell.textContent = auction.title;
				row.appendChild(titleCell);

				remTimeCell = document.createElement("td");
				remTimeCell.textContent = auction.remTime;
				row.appendChild(remTimeCell);

				linkCell = document.createElement("td");
				anchor = document.createElement("a");
				linkCell.appendChild(anchor);
				linkText = document.createTextNode("Details");

				anchor.appendChild(linkText);
				anchor.setAttribute('auctionID', auction.auctionID);
				anchor.addEventListener('click', (e) => {
					let auctionID = e.target.getAttribute("auctionID");

					if (window.sessionStorage.getItem("userID") !== auction.ownerID) {
						pageOrchestrator.openDetailsForOffer(auctionID);
					}
					else {
						pageOrchestrator.openDetailsForOwner(auctionID);

						if (Date.now() <= auction.expiryDate) {
							closeAucButton.hide();
						}
					}
				});

				anchor.href = "#";
				row.appendChild(linkCell);

				self.listContainerBody.appendChild(row);
			});
		}
	}

	/**
	  * Shows the list of the auctions found with the given key
	  */
	function RecentlySeenAuc(listContainer, listContainerBody) {
		this.listContainerBody = listContainerBody;
		const username = getCookie('username');

		this.hide = () => {
			listContainer.style.display = "none";
		}

		this.show = () => {
			let jsonCookie = getCookie('viewedAuctionsBy' + username);

			if (!jsonCookie) {
				this.hide();

			} else if (jsonCookie) {
				let auctionsList = JSON.parse(jsonCookie);

				makeCall("GET", "RecentAuctionsListRIA?auctionIDs=" + auctionsList, null, (req) => {
					if (req.readyState === XMLHttpRequest.DONE) {
						let message = req.responseText;
						let self = this;

						switch (req.status) {
							case 200:
								let auctionsList = JSON.parse(req.responseText);

								if (auctionsList === null) {
									listContainer.style.display = "none";
									return;
								}

								listContainer.style.display = "block";
								this.listContainerBody.innerHTML = "";


								let row, aucIDCell, ownIDCell, titleCell, linkCell, anchor, linkText;

								auctionsList.forEach((auction) => {
									row = document.createElement("tr");

									aucIDCell = document.createElement("td");
									aucIDCell.textContent = auction.auctionID;
									row.appendChild(aucIDCell);

									ownIDCell = document.createElement("td");
									ownIDCell.textContent = auction.ownerID;
									row.appendChild(ownIDCell);

									titleCell = document.createElement("td");
									titleCell.textContent = auction.title;
									row.appendChild(titleCell);

									linkCell = document.createElement("td");
									anchor = document.createElement("a");
									linkCell.appendChild(anchor);
									linkText = document.createTextNode("Details");

									anchor.appendChild(linkText);
									anchor.setAttribute('auctionID', auction.auctionID);
									anchor.addEventListener("click", () => {
										// Decides if the close auction button, or the offer form have to be shown
										if (parseInt(window.sessionStorage.getItem("userID")) !== parseInt(auction.ownerID)) {
											pageOrchestrator.openDetailsForOffer(auction.auctionID);
										}
										else {
											pageOrchestrator.openDetailsForOwner(auction.auctionID);
										}
									});

									anchor.href = "#";
									row.appendChild(linkCell);

									self.listContainerBody.appendChild(row);
								});

								return;
							case 403:
								cancelCookie('username');
								window.location.href = "index.html";
								break;
							default:
								self.alertBox.style.display = "block";
								self.alertBox.textContent = message;
								break;
						}
					}
				});
			}
		}
	}

	/**
	 * Shows the list of auctions won by the user
	 */
	function WonAuctionsList(alertBox, listContainer, listContainerBody) {
		this.alertBox = alertBox;
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
			this.alertBox.style.display = "none";
		}

		this.show = () => {
			makeCall("GET", "WonAuctionsListRIA", null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;
					let self = this;

					switch (req.status) {
						case 200:
							let auctionsList = JSON.parse(req.responseText);

							if (auctionsList === "No auctions found") {
								alertBox.style.display = "block";
								alertBox.textContent = message;
								listContainer.style.display = "none";
								return;
							}

							listContainer.style.display = "block";
							this.listContainerBody.innerHTML = "";
							self.alertBox.style.display = "none";
							
							let row, auctionIDCell, titleCell, finalPriceCell, linkCell, anchor, linkText;

							auctionsList.forEach((auction) => {
								row = document.createElement("tr");

								auctionIDCell = document.createElement("td");
								auctionIDCell.textContent = auction.auctionID;
								row.appendChild(auctionIDCell);

								titleCell = document.createElement("td");
								titleCell.textContent = auction.title;
								row.appendChild(titleCell);

								finalPriceCell = document.createElement("td");
								finalPriceCell.textContent = auction.actualPrice;
								row.appendChild(finalPriceCell);

								linkCell = document.createElement("td");
								anchor = document.createElement("a");
								linkCell.appendChild(anchor);
								linkText = document.createTextNode("Details");
								anchor.appendChild(linkText);
								anchor.setAttribute('auctionID', auction.auctionID);

								anchor.addEventListener("click", (e) => {
									let auctionID = e.target.getAttribute("auctionID");
									pageOrchestrator.closedDetails(auctionID);
								});

								anchor.href = "#";
								row.appendChild(linkCell);

								listContainerBody.appendChild(row);
							});
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							self.alertBox.style.display = "block";
							self.alertBox.textContent = message;
							return;
					}
				}
			})
		}
	}

	/**
	 * Shows the list of open auctions owned by the user
	 */
	function OpenAuctionsList(alertBox, listContainer, listContainerBody) {
		this.alertBox = alertBox;
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
			this.alertBox.style.display = "none";
		}

		this.show = () => {
			let self = this;
			let auctionsList = null;

			makeCall("GET", "OpenAuctionsListRIA", null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							auctionsList = JSON.parse(req.responseText);

							if (auctionsList === null) {
								alertBox.style.display = "block";
								alertBox.textContent = "No auctions found";
								listContainer.style.display = "none";
								return;
							}

							this.alertBox.style.display = "none";
							listContainer.style.display = "block";
							this.listContainerBody.innerHTML = "";

							let row, auctionIDCell, titleCell, actualPriceCell, remTimeCell, linkCell, anchor, linkText;

							auctionsList.forEach((auction) => {
								row = document.createElement("tr");

								auctionIDCell = document.createElement("td");
								auctionIDCell.textContent = auction.auctionID;
								row.appendChild(auctionIDCell);

								titleCell = document.createElement("td");
								titleCell.textContent = auction.title;
								row.appendChild(titleCell);

								actualPriceCell = document.createElement("td");
								actualPriceCell.textContent = auction.actualPrice;
								row.appendChild(actualPriceCell);

								remTimeCell = document.createElement("td");
								remTimeCell.textContent = auction.remTime;
								row.appendChild(remTimeCell);

								linkCell = document.createElement("td");
								anchor = document.createElement("a");
								linkCell.appendChild(anchor);
								linkText = document.createTextNode("Details");

								anchor.appendChild(linkText);
								anchor.setAttribute('auctionID', auction.auctionID);
								anchor.addEventListener("click", () => {
									pageOrchestrator.openDetailsForOwner(auction.auctionID);

									if (Date.now() <= Date.parse(auction.expiryDate)) {
										closeAucButton.hide();
									}
								});

								anchor.href = "#";
								row.appendChild(linkCell);

								self.listContainerBody.appendChild(row);
							});
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							this.alertBox.style.display = "block";
							this.alertBox.textContent = message;
							return;
					}
				}
			})
		}
	}

	/**
	 * Shows the list of closed auctions owned by the user
	 */
	function ClosedAuctionsList(alertBox, listContainer, listContainerBody) {
		this.alertBox = alertBox;
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "block";
			alertBox.style.display = "none";
		}

		this.show = () => {
			let self = this;
			let auctionsList = null;

			alertBox.style.display = "none";
			listContainer.style.display = "block";
			this.listContainerBody.innerHTML = "";

			makeCall("GET", "ClosedAuctionsListRIA", null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							auctionsList = JSON.parse(req.responseText);

							if (auctionsList === []) {
								alertBox.style.display = "block";
								alertBox.textContent = "No auctions found";
								listContainer.style.display = "none";
								return;
							}

							let row, auctionIDCell, titleCell, winnerIDCell, finalPriceCell, linkCell, anchor, linkText;

							auctionsList.forEach((auction) => {
								row = document.createElement("tr");

								auctionIDCell = document.createElement("td");
								auctionIDCell.textContent = auction.auctionID;
								row.appendChild(auctionIDCell);

								titleCell = document.createElement("td");
								titleCell.textContent = auction.title;
								row.appendChild(titleCell);

								winnerIDCell = document.createElement("td");
								winnerIDCell.textContent = auction.winnerID;
								row.appendChild(winnerIDCell);

								finalPriceCell = document.createElement("td");
								finalPriceCell.textContent = auction.actualPrice;
								row.appendChild(finalPriceCell);

								linkCell = document.createElement("td");
								anchor = document.createElement("a");
								linkCell.appendChild(anchor);
								linkText = document.createTextNode("Details");
								anchor.appendChild(linkText);
								anchor.setAttribute('auctionID', auction.auctionID);

								anchor.addEventListener("click", (e) => {
									let auctionID = e.target.getAttribute("auctionID");
									pageOrchestrator.closedDetails(auctionID);
								});

								anchor.href = "#";
								row.appendChild(linkCell);

								self.listContainerBody.appendChild(row);
							});
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							this.alertBox.style.display = "block";
							this.alertBox.textContent = message;
							return;
					}
				}
			})
		}
	}

	/**
	 * Form that allows to create a new article
	 */
	function NewArticleForm(formContainer) {
		this.hide = () => {
			formContainer.style.display = "none";
		}

		this.show = () => {
			formContainer.style.display = "block";
		}

		this.registerEvent = () => {
			document.getElementById("createArtSubmit").addEventListener('click', (e) => {
				let form = e.target.closest("form")

				if (form.checkValidity()) {
					makeCall("POST", "CreateArticleRIA", form, (req) => {
						if (req.readyState === XMLHttpRequest.DONE) {
							let message = req.responseText;

							switch (req.status) {
								case 200:
									const username = getCookie('username');

									setCookie("lastActionBy" + username, "SELL", 30);
									pageOrchestrator.showSell();
									break;
								case 403:
									cancelCookie('username');
									window.location.href = "index.html";
									break;
								default:
									alert(message);
									break;
							}
						}
					});
				} else {
					form.reportValidity();
				}
			});
		}
	}

	/**
	 * Form that allows to create a new auction
	 */
	function NewAuctionForm(formContainer, myArticles) {
		this.articleIDs = [];

		this.hide = () => {
			formContainer.style.display = "none";
			myArticles.hide();
		}

		this.show = () => {
			formContainer.style.display = "block";
			myArticles.show();
			this.articleIDs = [];
		}

		this.registerEvent = () => {
			document.getElementById("createAucSubmit").addEventListener('click', (e) => {
				let checkboxes = document.querySelectorAll('input[type="checkbox"][name="articleID"]');

				checkboxes.forEach((checkbox) => {
					if (checkbox.checked) {
						this.articleIDs.push(checkbox.value);
					}
				});

				let form = e.target.closest("form");

				if (form.checkValidity()) {
					makeCall("POST", "CreateAuctionRIA?articleIDs=" + this.articleIDs, form, (req) => {
						if (req.readyState === XMLHttpRequest.DONE) {
							let message = req.responseText;

							switch (req.status) {
								case 200:
									const username = getCookie('username');
									setCookie("lastActionBy" + username, "SELL", 30);
									this.articleIDs = [];
									pageOrchestrator.showSell();
									break;
								case 403:
									cancelCookie('username');
									window.location.href = "index.html";
									break;
								default:
									alert(message);
									break;
							}
						}
					});
				} else {
					form.reportValidity();
				}
			});
		}
	}

	/**
	  * shows the user articles that are available for a new auction
	  */
	function MyArticles(alertBox, listContainer, listContainerBody) {
		this.alertBox = alertBox;
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
			alertBox.style.display = "none";
		}

		this.show = () => {
			alertBox.style.display = "none";
			listContainer.style.display = "block";
			this.listContainerBody.innerHTML = "";

			let articlesList = null;

			makeCall("GET", "UserArticlesRIA", null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							articlesList = JSON.parse(req.responseText);

							if (articlesList === null) {
								alertBox.style.display = "block";
								this.alertBox.textContent = "No articles found. Before creating a new auction, insert at least an article";
								listContainer.style.display = "none";
								document.getElementById("auctionForm").style.display = "none";
								return;
							}

							document.getElementById("auctionForm").style.display = "block";
							let row, articleIDCell, nameCell, priceCell, checkboxCell, checkbox;

							articlesList.forEach((article) => {
								row = document.createElement("tr");

								articleIDCell = document.createElement("td");
								articleIDCell.insertAdjacentHTML('beforeend', "<id='myArtID' />");
								articleIDCell.textContent = article.articleID;
								row.appendChild(articleIDCell);

								nameCell = document.createElement("td");
								nameCell.textContent = article.name;
								row.appendChild(nameCell);

								priceCell = document.createElement("td");
								priceCell.textContent = article.price;
								row.appendChild(priceCell);

								checkbox = document.createElement('input');
								checkbox.type = "checkbox";
								checkbox.name = "articleID";
								checkbox.value = article.articleID;

								checkboxCell = document.createElement("td");
								checkboxCell.appendChild(checkbox);
								row.appendChild(checkboxCell);

								this.listContainerBody.appendChild(row);
							});
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							alertBox.style.display = "block";
							this.alertBox.textContent = message;
							return;
					}
				}
			});
		}
	}

	/**
	 * Shows the details of an open auction
	 */
	function OpenAuctionDet(listContainer, listContainerBody) {
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
		}

		this.show = (auctionID) => {
			let self = this;
			let auction = null;

			listContainer.style.display = "block";
			this.listContainerBody.innerHTML = "";

			makeCall("GET", "OpenAuctionDetailsRIA?auctionID=" + auctionID, null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							auction = JSON.parse(req.responseText);

							if (auction.length === 0) {
								listContainer.style.display = "none";
								return;
							}

							let row, auctionIDCell, titleCell, startPriceCell, minIncCell, expiryDateCell, actualPriceCell;

							row = document.createElement("tr");

							auctionIDCell = document.createElement("td");
							auctionIDCell.textContent = auctionID;
							auctionIDCell.insertAdjacentHTML('beforeend', "<id='detAucID' />");
							row.appendChild(auctionIDCell);

							titleCell = document.createElement("td");
							titleCell.textContent = auction.title;
							row.appendChild(titleCell);

							startPriceCell = document.createElement("td");
							startPriceCell.textContent = auction.startingPrice;
							row.appendChild(startPriceCell);

							minIncCell = document.createElement("td");
							minIncCell.textContent = auction.minIncrease;
							row.appendChild(minIncCell);

							expiryDateCell = document.createElement("td");
							expiryDateCell.textContent = auction.expiryDate;
							row.appendChild(expiryDateCell);

							actualPriceCell = document.createElement("td");
							actualPriceCell.textContent = auction.actualPrice;
							row.appendChild(actualPriceCell);

							self.listContainerBody.appendChild(row);
							auctionOffersList.show(auctionID);
							auctionArticles.show(auction.auctionID);

							// Adds the auction to the recently seen list
							const username = getCookie('username');
							let aucCookieList = getCookie('viewedAuctionsBy' + username);
							let aucID = parseInt(auction.auctionID);
							let seenList = [];

							if (aucCookieList) {
								seenList = JSON.parse(aucCookieList);

								if (!seenList.includes(aucID)) {
									seenList.push(aucID);
								}
							} else {
								seenList.push(aucID);
							}

							let newJson = JSON.stringify(seenList);
							setCookie('viewedAuctionsBy' + username, newJson, 30);
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							alert(message);
							return;
					}
				}
			})
		}
	}

	/**
	 * Shows the offers for an open auction
	 */
	function AuctionOffersList(alertBox, listContainer, listContainerBody) {
		this.alertBox = alertBox;
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
			this.alertBox.style.display = "none";
		}

		this.show = (auctionID) => {
			let self = this;
			let offersList = null;

			self.alertBox.style.display = "none";
			listContainer.style.display = "block";
			self.listContainerBody.innerHTML = "";

			makeCall("GET", "OffersDetailsRIA?auctionID=" + auctionID, null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							offersList = JSON.parse(req.responseText);

							if (offersList === null) {
								alertBox.style.display = "block";
								alertBox.textContent = "No offers found";
								listContainer.style.display = "none";
								return;
							}

							let row, offererIDCell, offeredPriceCell, offerDateCell;

							offersList.forEach((offer) => {
								row = document.createElement("tr");

								offererIDCell = document.createElement("td");
								offererIDCell.textContent = offer.userID;
								row.appendChild(offererIDCell);

								offeredPriceCell = document.createElement("td");
								offeredPriceCell.textContent = offer.price;
								row.appendChild(offeredPriceCell);

								offerDateCell = document.createElement("td");
								offerDateCell.textContent = offer.offerDate;
								row.appendChild(offerDateCell);

								self.listContainerBody.appendChild(row);
							});

							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							self.alertBox.style.display = "block";
							self.alertBox.textContent = message;
							return;
					}
				}
			})
		}

	}

	/**
	 * Allows the user to make an offer for an open auction
	 */
	function OfferForm(formContainer) {
		this.registerEvent = () => {
			document.getElementById("offerSubmit").addEventListener('click', (e) => {
				let form = e.target.closest("form");

				if (form.checkValidity()) {
					let auctionID = document.getElementById("offerID").value;
					let price = document.getElementById("offerPrice").value;

					makeCall("POST", "MakeAnOfferRIA?auctionID=" + auctionID + "&price=" + price, form, (req) => {
						if (req.readyState === XMLHttpRequest.DONE) {
							let message = req.responseText;

							switch (req.status) {
								case 200:
									pageOrchestrator.openDetailsForOffer(auctionID);
									break;
								case 403:
									cancelCookie('username');
									window.location.href = "index.html";
									break;
								default:
									alert(message);
									break;
							}
						}
					})
				} else {
					form.reportValidity();
				}
			})
		}

		this.hide = () => {
			formContainer.style.display = "none";
		}

		this.show = (auctionID) => {
			document.getElementById("offerID").value = auctionID;
			formContainer.style.display = "block";
		}
	}

	/**
	 * Allows the owner of the auction to close it
	 */
	function CloseAucButton(formContainer) {
		this.registerEvent = () => {
			document.getElementById("closeSubmit").addEventListener('click', (e) => {
				let form = e.target.closest("form");
				let auctionID = document.getElementById("closeID").value;

				// Removes the auction from the recently seen list
				const username = getCookie('username');
				let aucCookieList = getCookie('viewedAuctionsBy' + username);
				let seenList = [];

				if (aucCookieList) {
					seenList = JSON.parse(aucCookieList);

					if (seenList.includes(auctionID)) {
						seenList.splice(seenList.indexOf(auctionID));
					}
				}

				let newJson = JSON.stringify(seenList);
				setCookie('viewedAuctionsBy' + username, newJson, 30);

				if (form.checkValidity()) {
					makeCall("POST", "CloseOpenAuctionRIA?auctionID=" + auctionID, form, (req) => {
						if (req.readyState === XMLHttpRequest.DONE) {
							let message = req.responseText;

							switch (req.status) {
								case 200:
									pageOrchestrator.showSell();
									break;
								case 403:
									cancelCookie('username');
									window.location.href = "index.html";
									break;
								default:
									alert(message);
									break;
							}
						}
					})
				} else {
					form.reportValidity();
				}
			})
		}

		this.hide = () => {
			formContainer.style.display = "none";
		}

		this.show = (auctionID) => {
			document.getElementById("closeID").value = auctionID;
			formContainer.style.display = "block";
		}
	}

	/**
	 * Shows the details of a closed auction
	 */
	function ClosedAuctionDet(listContainer, listContainerBody) {
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
		}

		this.show = (auctionID) => {
			let self = this;
			let auction = null;

			listContainer.style.display = "block";
			this.listContainerBody.innerHTML = "";

			makeCall("GET", "ClosedAuctionDetailsRIA?auctionID=" + auctionID, null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							auction = JSON.parse(req.responseText);

							if (auction.length === 0) {
								listContainer.style.display = "none";
								return;
							}

							let clAuction = auction.firstObj;
							let winnerAddr = auction.secondObj.address;
							let row, auctionIDCell, titleCell, finalPriceCell, winnerIDCell, winnerAddrCell;

							row = document.createElement("tr");

							auctionIDCell = document.createElement("td");
							auctionIDCell.textContent = clAuction.auctionID;
							row.appendChild(auctionIDCell);

							titleCell = document.createElement("td");
							titleCell.textContent = clAuction.title;
							row.appendChild(titleCell);

							finalPriceCell = document.createElement("td");
							finalPriceCell.textContent = clAuction.actualPrice;
							row.appendChild(finalPriceCell);

							winnerIDCell = document.createElement("td");
							winnerIDCell.textContent = clAuction.winnerID;
							row.appendChild(winnerIDCell);

							winnerAddrCell = document.createElement("td");
							winnerAddrCell.textContent = winnerAddr;
							row.appendChild(winnerAddrCell);

							self.listContainerBody.appendChild(row);

							auctionArticles.show(clAuction.auctionID);
							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							alert(message);
							return;
					}
				}
			})
		}
	}

	/**
	 * Shows the list of the articles in an auction
	 */
	function AuctionArticles(listContainer, listContainerBody) {
		this.listContainerBody = listContainerBody;

		this.hide = () => {
			listContainer.style.display = "none";
		}

		this.show = (auctionID) => {
			let self = this;
			let articlesList = null;

			listContainer.style.display = "block";
			this.listContainerBody.innerHTML = "";

			makeCall("GET", "AuctionArticlesRIA?auctionID=" + auctionID, null, (req) => {
				if (req.readyState === XMLHttpRequest.DONE) {
					let message = req.responseText;

					switch (req.status) {
						case 200:
							articlesList = JSON.parse(req.responseText);

							let row, articleIDCell, nameCell, descriptionCell, imageCell, priceCell;

							articlesList.forEach((article) => {
								row = document.createElement("tr");

								articleIDCell = document.createElement("td");
								articleIDCell.textContent = article.articleID;
								row.appendChild(articleIDCell);

								nameCell = document.createElement("td");
								nameCell.textContent = article.name;
								row.appendChild(nameCell);

								descriptionCell = document.createElement("td");
								descriptionCell.textContent = article.description;
								row.appendChild(descriptionCell);

								let img = document.createElement("img");
								img.src = article.image;
								img.width = 100;
								img.height = 100;

								imageCell = document.createElement("td");
								imageCell.appendChild(img);
								row.appendChild(imageCell);

								priceCell = document.createElement("td");
								priceCell.textContent = article.price;
								row.appendChild(priceCell);

								self.listContainerBody.appendChild(row);
							});

							break;
						case 403:
							cancelCookie('username');
							window.location.href = "index.html";
							break;
						default:
							alert(message);
							return;
					}
				}
			})
		}
	}

	/**
	 * orchestrates the items shown on the page
	 */
	function PageOrchestrator() {
		this.start = () => {
			welcomeMessage = new WelcomeMessage(
				sessionStorage.getItem("username"),
				document.getElementById("username")
			);
			welcomeMessage.show();

			menu = new Menu();
			menu.registerEvents(this);

			searchForm = new SearchForm(
				document.getElementById("keyAuctionsMessage"),
				document.getElementById("searchForm")
			);
			searchForm.registerEvent(this);
			searchForm.hide();

			keyAuctionsList = new KeyAuctionsList(
				document.getElementById("keyAuctions"),
				document.getElementById("keyAuctionsBody")
			);
			keyAuctionsList.hide();

			recentAuc = new RecentlySeenAuc(
				document.getElementById("recentAuctions"),
				document.getElementById("recentAuctionsBody")
			);
			recentAuc.hide();

			wonAuctionsList = new WonAuctionsList(
				document.getElementById("wonAuctionsMessage"),
				document.getElementById("wonAuctions"),
				document.getElementById("wonAuctionsBody")
			);
			wonAuctionsList.hide();

			openAuctionsList = new OpenAuctionsList(
				document.getElementById("openAuctionsMessage"),
				document.getElementById("openAuctions"),
				document.getElementById("openAuctionsBody")
			);
			openAuctionsList.hide();

			closedAuctionsList = new ClosedAuctionsList(
				document.getElementById("closedAuctionsMessage"),
				document.getElementById("closedAuctions"),
				document.getElementById("closedAuctionsBody")
			);
			closedAuctionsList.hide();

			newArticleForm = new NewArticleForm(
				document.getElementById("createArticleForm")
			);
			newArticleForm.registerEvent(this);
			newArticleForm.hide();

			myArticles = new MyArticles(
				document.getElementById("myArticlesMessage"),
				document.getElementById("myArticles"),
				document.getElementById("myArticlesBody")
			);
			myArticles.hide();

			newAuctionForm = new NewAuctionForm(
				document.getElementById("createAuctionForm"),
				myArticles
			);
			newAuctionForm.registerEvent(this);
			newAuctionForm.hide();

			openAuctionDet = new OpenAuctionDet(
				document.getElementById("openAucDet"),
				document.getElementById("openAucDetBody")
			);
			openAuctionDet.hide();

			auctionOffersList = new AuctionOffersList(
				document.getElementById("aucOffersMessage"),
				document.getElementById("aucOffers"),
				document.getElementById("aucOffersBody")
			);
			auctionOffersList.hide();

			closedAuctionDet = new ClosedAuctionDet(
				document.getElementById("closedAucDet"),
				document.getElementById("closedAucDetBody")
			);
			closedAuctionDet.hide();

			auctionArticles = new AuctionArticles(
				document.getElementById("aucArticles"),
				document.getElementById("aucArticlesBody")
			);
			auctionArticles.hide();

			closeAucButton = new CloseAucButton(
				document.getElementById("closeAucButton")
			);
			closeAucButton.registerEvent();
			closeAucButton.hide();

			offerForm = new OfferForm(
				document.getElementById("offerForm")
			);
			offerForm.registerEvent();
			offerForm.hide();
			const username = getCookie('username');
			let lastAction = getCookie("lastActionBy" + username);

			if (lastAction === "SELL") {
				this.showSell();
			} else {
				this.showBuy();
			}
		}

		this.showSell = () => {
			this.reset();

			document.getElementById("sellContainer").style.display = "block";
			openAuctionsList.show();
			closedAuctionsList.show();
			newArticleForm.show();
			newAuctionForm.show();
		}

		this.showBuy = () => {
			this.reset();

			document.getElementById("buyContainer").style.display = "block";
			searchForm.show();
			wonAuctionsList.show();
			recentAuc.show();
		}

		this.openDetailsForOffer = (auctionID) => {
			this.reset();

			document.getElementById("openAucDetContainer").style.display = "block";
			openAuctionDet.show(auctionID);
			offerForm.show(auctionID);
		}

		this.openDetailsForOwner = (auctionID) => {
			this.reset();

			document.getElementById("openAucDetContainer").style.display = "block";
			openAuctionDet.show(auctionID);
			closeAucButton.show(auctionID);
		}

		this.closedDetails = (auctionID) => {
			this.reset();

			document.getElementById("closedAucDetContainer").style.display = "block";
			closedAuctionDet.show(auctionID);
		}

		// hides all the components
		this.reset = function() {
			// buy page components
			searchForm.hide();
			keyAuctionsList.hide();
			wonAuctionsList.hide();

			// sell page components
			openAuctionsList.hide();
			closedAuctionsList.hide();
			newArticleForm.hide();
			newAuctionForm.hide();

			// detail page components
			openAuctionDet.hide();
			auctionOffersList.hide();
			closedAuctionDet.hide();
			auctionArticles.hide();

			// commands
			closeAucButton.hide();
			offerForm.hide();

			// page containers
			document.getElementById("sellContainer").style.display = "none";
			document.getElementById("buyContainer").style.display = "none";
			document.getElementById("openAucDetContainer").style.display = "none";
			document.getElementById("closedAucDetContainer").style.display = "none";
		}
	}

	// main
	let welcomeMessage, menu, searchForm, keyAuctionsList, wonAuctionsList, openAuctionsList, closedAuctionsList,
		newArticleForm, newAuctionForm, openAuctionDet, auctionOffersList, closedAuctionDet, auctionArticles,
		closeAucButton, offerForm, recentAuc, myArticles;
	let pageOrchestrator = new PageOrchestrator();

	window.addEventListener("load", () => {
		const username = getCookie('username');

		if (!(username)) {
			window.location.href = "index.html";
		} else {
			pageOrchestrator.start();
		}
	}, false);
}
