# AI Pipeline


**Setting up Environment Using Anaconda**



sudo apt update && sudo apt upgrade -y

wget -O anaconda.sh https://repo.anaconda.com/archive/$(curl -s https://repo.anaconda.com/archive/ | grep -oP 'Anaconda3-\d{4}\.\d+-Linux-x86_64\.sh' | head -1)
bash anaconda.sh

export PATH="$HOME/anaconda3/bin:$PATH"

source ~/.bashrc

conda init

conda env create -f AI.yml

conda activate AI
