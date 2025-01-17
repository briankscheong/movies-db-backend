// Function to add a favorite movie for a user
export const addFavoriteMovie = async (username, movie_id, supabase) => {
    const { data, error } = await supabase
        .from('favorites')
        .upsert({ username: username, movie_id })  // upsert to avoid duplicates
        .single(); // To get a single record in the response

    if (error) {
        console.error('Error adding favorite movie:', error);
    } else {
        console.log('Favorite movie added:', data);
    }
};

// Define the SQL query to create the table
export const createTables = async (supabase) => {
    const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(255) PRIMARY KEY,  
      password TEXT NOT NULL,             
      refresh_token TEXT                 
    );
  `;

    const createFavoritesTableQuery = `
    CREATE TABLE IF NOT EXISTS favorite_movies (
      username VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE,  
      movie_id INT,
      PRIMARY KEY (username, movie_id)                                     
    );
  `;

    const triggerFunction = `
    create or replace function delete_expired_auth_entries()
    returns trigger language plpgsql as $$
    begin
    -- Check if the 'expires_at' field is in the past
    if now() >= NEW.expires_at then
        delete from auth where user_id = NEW.user_id; -- Delete expired row
    end if;

    -- Return the unchanged row (not modifying it)
    return NEW;
    end;
    $$;

    create trigger check_and_delete_expired_auth
    before insert or update on public.auth
    for each row execute function delete_expired_auth_entries();
    `;

    // Run the queries
    const { data: userData, error: userError } = await supabase
        .rpc('execute_sql', { sql: createUserTableQuery });

    if (userError) {
        console.error('Error creating users table:', userError);
        return;
    }
    console.log('Users table created successfully', userData);

    const { data: favoritesData, error: favoritesError } = await supabase
        .rpc('execute_sql', { sql: createFavoritesTableQuery });

    if (favoritesError) {
        console.error('Error creating favorites table:', favoritesError);
        return;
    }
    console.log('Favorites table created successfully', favoritesData);
};