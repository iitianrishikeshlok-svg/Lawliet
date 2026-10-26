param([int]$port = 8080)

$ip = [System.Net.IPAddress]::Loopback
$server = [System.Net.Sockets.TcpListener]::new($ip, $port)
$server.Start()
Write-Host "L HUD Web Server active on http://localhost:$port/ and http://127.0.0.1:$port/"

$htmlPath = "c:\Users\Rushikesh\Downloads\ASD\standalone.html"
$htmlBytes = [System.IO.File]::ReadAllBytes($htmlPath)

while ($true) {
    try {
        $client = $server.AcceptTcpClient()
        $stream = $client.GetStream()
        
        $buf = New-Object byte[] 4096
        $read = $stream.Read($buf, 0, $buf.Length)
        
        $header = "HTTP/1.1 200 OK`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($htmlBytes.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
        
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($htmlBytes, 0, $htmlBytes.Length)
        $stream.Flush()
        
        $stream.Close()
        $client.Close()
    } catch {
        # ignore and continue
    }
}
