<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Google\Cloud\Storage\StorageClient;

/**
 * Checks that the JWT assertion is valid (properly signed, for the
 * correct audience) and if so, returns strings for the requesting user's
 * email and a persistent user ID. If not valid, returns null for each field.
 *
 * @param string $idToken The JWT string to assert.
 * @param string $audience The audience of the JWT.
 *
 * @return string[] array containing [$email, $id]
 * @throws Exception on failed validation
 */
function validate_assertion(string $idToken, string $audience): array
{
    $auth = new Google\Auth\AccessToken();
    $info = $auth->verify($idToken, [
        'certsLocation' => Google\Auth\AccessToken::IAP_CERT_URL,
        'throwException' => true,
    ]);

    if ($audience != $info['aud'] ?? '') {
        throw new Exception(
            sprintf(
                'Audience %s did not match expected %s',
                $info['aud'],
                $audience
            )
        );
    }

    return [$info['email'], $info['sub']];
}

/**
 * Print an entity role for a file ACL.
 *
 * @param string $bucketName The name of your Cloud Storage bucket.
 *        (e.g. 'my-bucket')
 * @param string $objectName The name of your Cloud Storage object.
 *        (e.g. 'my-object')
 * @param string $entity The entity for which to query access controls.
 *        (e.g. 'user-example@domain.com')
 */
function print_file_acl_for_user(
    string $bucketName,
    string $objectName,
    string $entity
): void {
    $storage = new StorageClient();
    $bucket = $storage->bucket($bucketName);
    $object = $bucket->object($objectName);
    $acl = $object->acl();
    $item = $acl->get(['entity' => $entity]);
    printf('%s: %s' . PHP_EOL, $item['entity'], $item['role']);
}

$endpoint = @parse_url($_SERVER['REQUEST_URI'])['path'];
if (substr($endpoint, -1) == '/') {
    $endpoint .= 'index.html';
}

if (!Google\Auth\Credentials\GCECredentials::onGce()) {
    throw new Exception('You must deploy to appengine to run this sample');
}
$metadata = new Google\Cloud\Core\Compute\Metadata();
$audience = sprintf(
    '/projects/%s/apps/%s',
    $metadata->getNumericProjectId(),
    $metadata->getProjectId()
);
$idToken = getallheaders()['X-Goog-Iap-Jwt-Assertion'] ?? '';
$email = null;
try {
    list($email, $id) = validate_assertion($idToken, $audience);
    echo '<pre>' . $email . PHP_EOL . $id . '</pre>';
} catch (Exception $e) {
    printf('Failed to validate assertion: %s', $e->getMessage());
}
if ($email) {
    print_file_acl_for_user($_ENV['BUCKET'], $endpoint, $email);
} else {
    echo '$email is null';
}
