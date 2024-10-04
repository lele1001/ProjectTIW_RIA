# Progetto TIW - versione RIA (A.A. 2022/2023)

**ITA** - Il progetto ha come obbiettivo la creazione di un'applicazione web che rispetti le specifiche fornite dal docente. Questo progetto, insieme alla sua versione HTML, è valido come prova d'esame per il corso **"Tecnologie Informatiche per il Web"** del percorso di laurea in **Ingegneria Informatica** del Politecnico di Milano.

**EN** - The aim of the project is the development of a web application that satisfies the given specifications. This project, together with its HTML version, is valid as final exam for the **"Tecnologie Informatiche per il Web"** course of **Computer Science Engineering** at Politecnico di Milano.

**Teacher**: Piero Fraternali

**Final mark**: 27/30

## Project specification - Esercizio 1: aste online

### Versione JavaScript

Si realizzi un’applicazione client server web che estende e/o modifica le specifiche della versione HTML pura come segue:

● Dopo il login, l’intera applicazione è realizzata con un’unica pagina. 

● Se l’utente accede per la prima volta l’applicazione mostra il contenuto della pagina ACQUISTO. Se l’utente ha già usato l’applicazione, questa mostra il contenuto della pagina VENDO se l’ultima azione dell’utente è stata la creazione di un’asta; altrimenti mostra il contenuto della pagina ACQUISTO con l’elenco (eventualmente vuoto) delle aste su cui l’utente ha cliccato in precedenza e che sono ancora aperte. L’informazione dell’ultima azione compiuta e delle aste visitate è memorizzata a lato client per la durata di un mese.

● Ogni interazione dell’utente è gestita senza ricaricare completamente la pagina, ma produce l’invocazione asincrona del server e l’eventuale modifica solo del contenuto da aggiornare a seguito dell’evento.
