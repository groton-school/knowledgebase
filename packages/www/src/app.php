<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Google\Cloud\Storage\StorageClient;

$storage = new StorageClient();
$storage->registerStreamWrapper();

$endpoint = @parse_url($_SERVER['REQUEST_URI'])['path'];
if (substr($endpoint, -1) == '/') {
    $endpoint .= 'index.html';
}

echo file_get_contents("gs://thermal-well-418718-cache$endpoint");
