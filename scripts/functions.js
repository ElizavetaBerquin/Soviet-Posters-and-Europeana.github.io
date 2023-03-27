window.onscroll = function() {myScrollFunction()};

var allData = [];
var query = 'https://api.europeana.eu/record/v2/search.json?query=(soviet+OR+socialist+OR+russia+OR+russian)+AND+(poster)&reusability=open,restricted,permission&media=true&wskey=HcXsJWS7b';
//Sets how many posters to display
//Please note it takes time to load 1000 items
var maxElements = 1000;

//Downloading all the elements
async function downloadElements(rows = maxElements, cursor = '*') {
    //Adding 'rows' and 'cursor' to the query to get all the elements
    finalQuery = query + '&rows=' + rows + '&cursor=' + cursor;
    await fetch(finalQuery)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            //Goes over the data by subtracting 100 rows from the initial number until it reaches the end
            appendElementData(data);
            rows -= 100;
            if (data.nextCursor && rows > 0) {
                //encodeURIComponent to avoid the encoding error
                downloadElements(rows, encodeURIComponent(data.nextCursor));
            } else {
                console.log('Items loaded: ', allData.length);
            }
        })
        .catch(function (err) {
            console.log('error: ' + err);
        });
    //Gets the colors
    getImageColors();
}

function displayImages() {
    let images = document.getElementById("images");
    images.innerHTML = '';
    //Using lodash to go through each element one by one and to get the images from url and to create a div container for each image
    _.forEach(allData, function (element)  {
        const divParent = document.createElement('div');
        divParent.style.backgroundImage = 'url(' + element.imageUrl + ')';
        images.appendChild(divParent);

    });
}

//Saves all ids and images from fetch to add them to array
function appendElementData(data) {
    if (data.items) {
        _.forEach(data.items, function (item) {
            allData.push({
                id: item.id,
                imageUrl: item.edmPreview[0]
            });
        });
    }
}

function getImageColors() {
    //Using lodash to go one by one in the all data collection
    //value = object itself
    //index = position of this object in the array
    _.forEach(allData, async function (value, index) {
        //setTimout sets a time delay between requests
        setTimeout(async function () {
            //Fetch method to make the second Record API call
            await fetch("https://api.europeana.eu/api/v2/record" + value.id + ".json?&wskey=HcXsJWS7b")
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    //Sorting by colors happens here
                    //If index equals the number of all elements – it has reached the end
                    if (index === allData.length - 1) {
                        //Lodash to filter out the images without color
                        allData = _.filter(allData, function(o) {return o.colorHEX});

                        //Sorting by colors
                        allData.sort(function (c, i) {
                            //Sorting by Hue
                            return c.colorHSL.h - i.colorHSL.h

                            //Sorting by Lightness
                            //return c.colorHSL.l - i.colorHSL.l

                            //Sorting by Saturation
                            //return c.colorHSL.s - i.colorHSL.s;

                            //Sorting by HEX
                            //return c.colorHEX - i.colorHEX
                        });

                        // Calling a function to display images
                        displayImages();
                        console.log('Images displayed: ', allData.length);
                        console.log('All data: ', allData);
                        return;
                    }
                    if (index > allData.length - 1) return;

                    //Checking that all necessary elements are present to avoid exceptions
                    if (data.object && data.object.aggregations.length && data.object.aggregations[0].webResources.length && data.object.aggregations[0].webResources[0].edmComponentColor) {
                        let currentItem = allData[index];
                        if (currentItem) {
                            currentItem.colorHEX = data.object.aggregations[0].webResources[0].edmComponentColor[0];
                            currentItem.colorHSL = toHSL(currentItem.colorHEX);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('error: ' + err);
                });
            //Timeout:
        }, index * 100);
    });
}

//Converting colours to HSL
function toHSL(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    s = Math.round(s * 100);
    l = Math.round(l * 100);
    h = Math.round(360 * h);

    return {
        h,
        s,
        l
    };
}

//Enables scroll indicator
function myScrollFunction() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    document.getElementById("myBar").style.width = scrolled + "%";
}