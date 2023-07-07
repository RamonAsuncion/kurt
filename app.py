from flask import Flask, render_template, send_from_directory, url_for
app = Flask(__name__)

@app.route('/')
@app.route('/index')
def index():
    mp3_url = url_for('static', filename='detected.mp3')
    return render_template('index.html', mp3_url=mp3_url)

@app.route('/models/<path:filename>')
def models(filename):
    return send_from_directory('static/models', filename)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder, 'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.debug = True
    app.run()
