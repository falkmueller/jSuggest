<?php
header('Content-type: application/json');
$result = array();

if(empty($_REQUEST["search"])){
    echo json_encode( $result );
    exit();
}

$search_value = $_REQUEST["search"];

$data = array(
    "test1", "test2", "test3", "falk-m"
);

foreach ($data as $text){
    if (strpos(strtolower($text), strtolower($search_value)) !== false)
    {
        $result[] = $text;      
    }
    
}

echo json_encode( $result );