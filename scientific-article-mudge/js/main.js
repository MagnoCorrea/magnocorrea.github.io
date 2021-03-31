// Dados internos do sistema
var metricType = ['Palavra Chave', 'Tempo de publicação', 'Qualificacao em sistema Externo'];
var balance = [
    {
        "name": "pouco maior",
        "simbol" : ">",
        "score": 1
    },
    {
        "name": "maior",
        "simbol" : ">>",
        "score": 3
    },
    {
        "name": "muito maior",
        "simbol" : ">>>",
        "score": 5
    }
];
var mudgeDiagram = [];
function stateMachine(e, anchorObject, stepIndex, stepDirection) {
    switch (stepIndex) {
        case 1:
            var metrics = exportMetrics();
            var html = "";
            console.log(stepDirection);
            //backward e forward
            if ("forward" == stepDirection) {
                
            }
            mudgeDiagram = genMudge(metrics, balance[0]);
            mudgeDiagram.forEach(tmp => {
                html += generateHTML(tmp);
            });
            $("#metrics").html(html);
            break;
    
        default:
            break;
    }
    
}

function generateHTML(tmp) {
    var html = '<div class="row">';

    html += '<div class="col-xs-3">';
    html += '<select class="form-control">';
    html += '<option value="' + tmp.fieldFrom + '">' + tmp.fieldFrom + '</option>';
    html += '<option value="' + tmp.fieldTo + '">' + tmp.fieldTo + '</option>';
    html += '</select>';
    html += '</div>';

    html += '<div class="col-xs-3">';
    html += '<select class="form-control">';
    html += '<option value="' + tmp.fieldTo + '">' + tmp.fieldTo + '</option>';
    html += '<option value="' + tmp.fieldFrom + '">' + tmp.fieldFrom + '</option>';
    html += '</select>';
    html += '</div>';

    html += '<div class="col-xs-3">';
    html += '<select class="form-control">';
    balance.forEach(tmpBalance => {
        if(tmpBalance.score ===  tmp.balance.score ) {
            html += '<option value="' + tmpBalance.score + '" selected>' + tmpBalance.simbol + '</option>';
        } else {
            html += '<option value="' + tmpBalance.score + '">' + tmpBalance.simbol + '</option>';
        }
    });
    html += '</select>';
    html += '</div>';
    html += '</div>';
    return html;

}

function genMudge(metric, minimumBalance) {
    var retorno = [];
    for(var i = 0; i< metric.length-1; i++) {
      var tmpFrom =metric[i];
      for(var j = i+1; j< metric.length; j++) {
        var tmpTo =metric[j];
        var tmp = {
        'fieldFrom' : tmpFrom.field,
        'fieldTo' : tmpTo.field,
        'description': tmpFrom.field + minimumBalance.score,
        'balance': minimumBalance
        };
  retorno.push(tmp);
      }
     
    }
    return retorno;
  }