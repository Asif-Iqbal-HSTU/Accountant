<?php
$url = 'http://127.0.0.1:8123/api/register';
$data = [
    'name' => 'Test User ' . rand(1000, 9999),
    'email' => 'test' . rand(1000, 9999) . '@example.com',
    'password' => 'password',
    'role' => 'client'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
} else {
    echo $response;
}

curl_close($ch);
