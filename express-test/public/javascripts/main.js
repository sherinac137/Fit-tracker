document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('weightLossForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const resultDiv = document.getElementById('result');
        
        console.log(`Start Date: ${startDate}, End Date: ${endDate}`);

        // Fetch URL
        const fetchUrl = `/Ajaxweight/weightloss?startDate=${startDate}&endDate=${endDate}`;
        console.log(`Fetching: ${fetchUrl}`);

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Data received:', data);
                if (data.weightLoss !== undefined) {
                    resultDiv.textContent = `Weight Loss: ${data.weightLoss} kg`;
                } else if (data.error) {
                    resultDiv.textContent = data.error;
                } else {
                    resultDiv.textContent = 'Unexpected error calculating weight loss.';
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
                resultDiv.textContent = 'An error occurred: ' + error.message;
            });
    });
});
