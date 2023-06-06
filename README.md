# Images on a Map 🌍 📷

Welcome to Images on a Map! This project uses [Leaflet](https://leafletjs.com/) to display an interactive map of Europe, with images representing each country. The images are loaded from geojson files that are selected via a dropdown menu. 

## Features ✨

- Interactive map of Europe 🏰
- Each country is represented by a unique image 🖼
- Easily switch between different geojson files using a dropdown menu ⬇️
- Images are fully displayed without any interaction required 👀

## How it works ⚙️

1. Geojson files are stored in the `geojson_data` folder. Each geojson file contains information about the countries in Europe and a corresponding image in base64 format. 
2. The Leaflet library is used to display the map and images.
3. A dropdown menu allows you to select a geojson file. When you select a file, the map updates to display the images from the selected file. 

## Generate your own geojson files 🔧

In the `notebooks` directory, you'll find a Jupyter notebook that shows you how to create your own geojson files. Feel free to create your own datasets and share them here! 

## Run the project 🏃

Just clone this repository and open `index.html` in your favorite browser! 

```
git clone https://github.com/louispaulet/images_on_a_map.git
```

## Contribute 🤝

Want to contribute? Great! Just fork this repository, make your changes, and open a pull request. All contributions are greatly appreciated!

## License 📃

This project is licensed under the MIT License - see the `LICENSE` file for more details.
