library(htmltools)
library(readr)

create_carousel_with_csv <- function(folder_path, csv_path, carousel_id = "myCarousel",
                                     auto_play = TRUE, interval = 5000) {
  
  # Read the CSV file
  captions_df <- read_csv(csv_path, show_col_types = FALSE)
  
  # Check if CSV has required columns
  required_cols <- c("filename", "title", "caption")
  if(!all(required_cols %in% names(captions_df))) {
    return(HTML(paste("<p>Error: CSV must have columns:", 
                      paste(required_cols, collapse = ", "), "</p>")))
  }
  
  n_images <- nrow(captions_df)
  
  if(n_images == 0) {
    return(HTML("<p>No images found in CSV file.</p>"))
  }
  
  # Create full paths for images
  image_paths <- file.path(folder_path, captions_df$filename)
  
  # Check if image files exist
  existing_images <- file.exists(image_paths)
  if(!all(existing_images)) {
    missing <- captions_df$filename[!existing_images]
    warning("Missing image files: ", paste(missing, collapse = ", "))
  }
  
  # Filter to only existing images
  captions_df <- captions_df[existing_images, ]
  image_paths <- image_paths[existing_images]
  n_images <- length(image_paths)
  
  if(n_images == 0) {
    return(HTML("<p>No image files found in the specified folder.</p>"))
  }
  
  # Create indicators
  indicators <- paste0(
    '<div class="carousel-indicators">',
    paste(sapply(0:(n_images-1), function(i) {
      active <- if(i == 0) ' class="active"' else ''
      sprintf('<button type="button" data-bs-target="#%s" data-bs-slide-to="%d"%s></button>',
              carousel_id, i, active)
    }), collapse = "\n"),
    '</div>'
  )
  
  # Create slides
  slides <- paste(sapply(1:n_images, function(i) {
    active <- if(i == 1) ' active' else ''
    sprintf('
    <div class="carousel-item%s">
      <img src="%s" class="d-block w-100" alt="%s">
      <div class="carousel-caption d-none d-md-block">
        <h5>%s</h5>
        <p>%s</p>
      </div>
    </div>', active, image_paths[i], captions_df$title[i], 
            captions_df$title[i], captions_df$caption[i])
  }), collapse = "\n")
  
  # Set auto-play attribute
  ride_attr <- if(auto_play) 'data-bs-ride="carousel"' else 'data-bs-ride="false"'
  
  # Combine everything
  carousel_html <- sprintf('
  <div id="%s" class="carousel slide" %s data-bs-interval="%d">
    %s
    <div class="carousel-inner">
      %s
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#%s" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#%s" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>
  </div>', carousel_id, ride_attr, interval, indicators, slides, carousel_id, carousel_id)
  
  return(HTML(carousel_html))
}
