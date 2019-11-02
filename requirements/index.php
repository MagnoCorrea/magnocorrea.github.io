<?php
try {
    $db = new SQLite3('Invetario.db');
} catch (Exception $e) {
    die($e->getMessage());
}

if (sqlite_table_exists($db, 'table_name') == false) {
  echo("ok");
//    $db->exec('CREATE TABLE ...');
}
function sqlite_table_exists($db, $mytable)
{
    $stmt = $db->prepare("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=:name");
    $stmt->bindValue('name', $mytable);
    $result = $stmt->execute();

    $row = $result->fetchArray(SQLITE3_NUM);

    return $row[0] > 0;
}
?>
