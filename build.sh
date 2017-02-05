#!/bin/bash

#Installation
##sudo apt install npm
##sudo apt-get install -y nodejs
##sudo npm install -g node-sass


#compile css
echo "compile scss to css"
node-sass scss/suggest.scss css/suggest.css
node-sass --output-style=compressed scss/suggest.scss css/suggest.min.css
