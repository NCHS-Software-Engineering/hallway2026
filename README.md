# Hallway-Nav
A [React](https://react.dev/)-based app to help NCHS students find their classrooms.

## How to run
- Install [VSCode](https://code.visualstudio.com/), [NodeJS](https://nodejs.org/en), and [NPM](https://www.npmjs.com/). Depending on the operating system of your personal computer, you might need to install [Homebrew](https://brew.sh/) for some of the programs to work.
- This program uses a lot of dependencies. In case you get an error because React cannot find one, check the first few lines of the [package-lock.json](https://github.com/NCHS-Software-Engineering/Hallway-Nav/blob/main/client/package-lock.json) file for them. Install a dependency by opening a terminal in VSCode, changing the directory to client by entering "cd client", and entering "npm i {dependency-name}" for every dependency necessary.
- Run the program by:
  - changing the directory to server by entering "cd server", then entering "node server.js" into the terminal;
  - then changing the directory to client by entering "cd ./" followed by "cd client", then entering "npm start" into the terminal.
    - The expected result should be a page that has a dropdown menu of rooms and a button to find a route from the main entrance to that room. An HTML canvas will show attempting to display the path, but as of now it does not work for as many rooms as one would like
- Stop the program by pressing Ctrl-C in the terminal (If it asks you if you want to terminate the batch job, enter "Y" for yes).

## Specifications
- Using Tableau to show the map and display everything.
- Using the A star algorithm to find the shortest route to everything.
- Converting the PNG files of each floor and importing them into CBI studios.
- Getting the map coordinates by filling the hallways with point and export them to React in CSV and JSON format. 
