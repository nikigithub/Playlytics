# Npm project issues viewer for Github

Dependencies
------------
The Npm project environment relies [Bower](http://bower.io/) and [Node](https://nodejs.org/) to run.

Both must be installed on the system before trying to run the local environment.

Node, NPM, and all dependencies are automatically installed into the local directory when running Gulp.

### Gulp
Gulp is our task runner, meaning it handles tasks such as compiling our SASS into CSS and checking and concatenating our JS files into single packages.

Installation
------------
After you clone this repo to your desktop, go to its root directory and run `npm install` , `bower install` and `npm run gulp` to install its dependencies.

	$ npm install
	$ bower install
	$ npm run gulp

Running
------------
Once the dependencies are installed, you can run `npm start` to start the application. You will then be able to access it at localhost:8080

	$ npm start

