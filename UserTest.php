<?php
use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

/**
 * Problem 1 – required backend tests
 * 1. testGet_UserList   → expect 200
 * 2. testPost_CreateUser→ expect 201
 * 3. testPost_LoginUser → expect 201
 * 4. testPost_FailedLogin → expect 201 (negative test)
 */
class UserTest extends TestCase
{
    private Client $client;

    protected function setUp(): void
    {
        $this->client = new Client([
            'base_uri'    => 'http://localhost', // add :PORT if Apache uses non‑80
            'http_errors' => false,
            'timeout'     => 5,
        ]);
    }

    /** 1. GET user list must return 200 */
    public function testGet_UserList(): void
    {
        $response = $this->client->get('/WesDashAPI/register.php');
        $this->assertEquals(
            200,
            $response->getStatusCode(),
            'GET /WesDashAPI/register.php should return 200'
        );
    }

    /** 2. POST create user must return 201 */
    public function testPost_CreateUser(): void
    {
        $username = 'newuser_' . time(); // unique username
        $response = $this->client->post('/WesDashAPI/register.php', [
            'json' => [
                'username'          => $username,
                'password'          => 'securePass123!',
                'confirm_password'  => 'securePass123!',
            ],
        ]);
        $this->assertEquals(
            201,
            $response->getStatusCode(),
            'User creation should return 201'
        );
    }

    /** 3. POST valid login must return 201 */
    public function testPost_LoginUser(): void
    {
        $response = $this->client->post('/WesDashAPI/login.php', [
            'json' => [
                'username' => 'testuser',      // must exist in DB
                'password' => 'password123',   // correct password
            ],
        ]);
        $this->assertEquals(
            201,
            $response->getStatusCode(),
            'Valid login should return 201'
        );
    }

    /** 4. POST invalid login must also return 201 (negative test) */
    public function testPost_FailedLogin(): void
    {
        $response = $this->client->post('/WesDashAPI/login.php', [
            'json' => [
                'username' => 'nonexistent_user',
                'password' => 'wrongpassword',
            ],
        ]);
        $this->assertEquals(
            201,
            $response->getStatusCode(),
            'Invalid login should still return 201 (per assignment)'
        );
    }
}
