let facturaGlobal = {};
const { createClient } = supabase
const supabaseUrl = 'https://xrckiknyndtzrbjymlhx.supabase.co';
const supabaseKey = 'sb_publishable_YLTAQ36JVj8m7O2noMcdJg_oADlsbG7';
const _supabase = createClient(supabaseUrl, supabaseKey);

const fecha = new Date(document.getElementById("fecha").value);
const fechaFormateada = fecha.toLocaleDateString("es-ES");
const ultimoDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toLocaleDateString("es-ES");

async function searchClient(id_cliente){
    let { data: facturas, error } = await _supabase
    .from('facturas')
    .select('*')
    .eq('cliente_id', id_cliente)
    .order('fecha', { ascending: false })
    .limit(1)
    .single(); 
  
  if(facturas){
  document.getElementById("fecha").value = facturas.fecha
  document.getElementById("lecturaAnterior").value = facturas.lectura_anterior
  document.getElementById("lecturaActual").value = facturas.lectura_actual
  document.getElementById("saldoAnterior").value = facturas.saldo_anterior
  }
  else{
  document.getElementById("fecha").value = new Date(document.getElementById("fecha").value);
  document.getElementById("lecturaAnterior").value = 0
  document.getElementById("lecturaActual").value = 0
  document.getElementById("saldoAnterior").value = 0
  }
    
    console.log(facturas)
}

async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;

    let { data: clientes, error } = await _supabase
    .from('clientes')
    .select('*')
    if (error) {
        console.error(error);
        document.getElementById('resultado').textContent = 'Error: ' + error.message;
    } else {
        const select = document.getElementById("miSelect");
        select.innerHTML = '';
        clientes.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.nombre;
        select.appendChild(option);
        });
    }
}


function calcular() {
  const select = document.getElementById("miSelect");
  const idCliente = select.value;
  const cliente = select.options[select.selectedIndex].text;
  const fecha = new Date(document.getElementById("fecha").value);
  const lecturaAnterior = parseFloat(document.getElementById("lecturaAnterior").value);
  const lecturaActual = parseFloat(document.getElementById("lecturaActual").value);
  const saldoAnterior = parseFloat(document.getElementById("saldoAnterior").value);
  const tarifa = parseFloat(document.getElementById("tarifa").value);

  const consumo = lecturaActual - lecturaAnterior;
  const totalPagar = consumo * tarifa + saldoAnterior;

  const fechaFormateada = fecha.toLocaleDateString("es-ES");
  const ultimoDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toLocaleDateString("es-ES");

  facturaGlobal = {
    idCliente,
    cliente,
    fecha: fechaFormateada,
    lecturaAnterior,
    lecturaActual,
    consumo,
    saldoAnterior,
    totalPagar,
    fechaMaxPago: ultimoDelMes
  };

  document.getElementById("resultado").innerHTML = `
    <table style="width:100%">
        <tr>
            <td>Nombre:</td>
            <td>${cliente}</td>
        </tr>
        <tr>
            <td>Fecha:</td>
            <td>${fechaFormateada}</td>
        </tr>
        <tr>
            <td>Lectura anterior:</td>
            <td>${lecturaAnterior}</td>
        </tr>
        <tr>
            <td>Lectura actual:</td>
            <td>${lecturaActual}</td>
        </tr>
        <tr>
            <td>Consumo de agua (m3):</td>
            <td>${consumo}</td>
        </tr>
        <tr>
            <td>Saldo anterior (L):</td>
            <td>${saldoAnterior.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Total a pagar (L):</td>
            <td>${totalPagar.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Fecha máxima de pago:</td>
            <td>${ultimoDelMes}</td>
        </tr>
        <tr>
            <td colspan="2" style="text-align: center;">
                Los pagos unicamente a tráves de depósito/tranferencia a cuenta.
            </td>
        </tr>
        <tr>
        <td colspan="2" style="background-color: #ffffff">
                <div style="color: #2f771b;">Comprobante de depósito respalda el pago</div>
               <div style="font-weight: bold; color: black;">#cta BAC: 746288631</div>
            </td>
        </tr>
    </table>
  `;

  guardarNuevoRegistro(facturaGlobal)
}

async function guardarNuevoRegistro(facturaGlobal){
    let fecha = new Date(document.getElementById("fecha").value)
    let fechaISO = fecha.toISOString().split('T')[0];
    let fechaLimite = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data, error } = await _supabase
    .from('facturas')
    .insert([
        { 
            cliente_id: facturaGlobal.idCliente,
            fecha: fechaISO,
            lectura_anterior: facturaGlobal.lecturaAnterior,
            lectura_actual: facturaGlobal.lecturaActual, 
            saldo_anterior: facturaGlobal.saldoAnterior,
            total_pagar: facturaGlobal.totalPagar, 
            fecha_limite_pago: fechaLimite
        },
    ])
    .select()

    if (error) {
        console.error(error);
        document.getElementById('resultado').textContent = 'Error: ' + error.message;
    } else {
        cargarDatos()
    }
}
function generarImagen() {
  const resultado = document.getElementById("resultado");
  if (!resultado.innerHTML.trim()) {
    alert("Por favor primero genera la factura.");
    return;
  }

  html2canvas(resultado).then(canvas => {
    const link = document.createElement('a');
    link.download = `factura_${facturaGlobal.cliente.replace(/\s/g, "_")}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });

}
