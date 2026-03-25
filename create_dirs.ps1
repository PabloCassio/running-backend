# Script para criar estrutura de diretórios
$directories = @(
    "middleware",
    "controllers", 
    "models",
    "routes",
    "services",
    "utils",
    "sockets"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path ".\src\$dir" -Force
    Write-Host "Criado diretório: src\$dir"
}