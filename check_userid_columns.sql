SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE column_name = 'userId' 
ORDER BY table_name, column_name;
